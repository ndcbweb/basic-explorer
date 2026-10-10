import { db } from "./db";

export const PAGE_SIZE = 25;

export function pageParams(searchParams, size = PAGE_SIZE) {
  const page = Math.max(1, Number.parseInt(searchParams?.p, 10) || 1);
  return { page, limit: size, offset: (page - 1) * size };
}

export function latestBlocks({ limit = PAGE_SIZE, offset = 0 } = {}) {
  const blocks = db().prepare("SELECT * FROM blocks ORDER BY number DESC LIMIT ? OFFSET ?").all(limit, offset);
  if (!blocks.length) return blocks;
  const fees = new Map();
  const rows = db()
    .prepare("SELECT block_number, fee FROM txs WHERE block_number BETWEEN ? AND ? AND fee IS NOT NULL")
    .all(blocks[blocks.length - 1].number, blocks[0].number);
  for (const row of rows) fees.set(row.block_number, (fees.get(row.block_number) || 0n) + BigInt(row.fee));
  return blocks.map((block) => ({ ...block, fees: (fees.get(block.number) || 0n).toString() }));
}

export function blockCount() {
  return db().prepare("SELECT COUNT(*) AS n FROM blocks").get().n;
}

export function latestTxs({ limit = PAGE_SIZE, offset = 0, block = null } = {}) {
  if (block != null) {
    return db()
      .prepare("SELECT * FROM txs WHERE block_number = ? ORDER BY tx_index ASC LIMIT ? OFFSET ?")
      .all(block, limit, offset);
  }
  return db().prepare("SELECT * FROM txs ORDER BY block_number DESC, tx_index DESC LIMIT ? OFFSET ?").all(limit, offset);
}

export function txCount({ block = null } = {}) {
  if (block != null) return db().prepare("SELECT COUNT(*) AS n FROM txs WHERE block_number = ?").get(block).n;
  return db().prepare("SELECT COUNT(*) AS n FROM txs").get().n;
}

export function addressTxs(address, { limit = PAGE_SIZE, offset = 0 } = {}) {
  return db()
    .prepare(
      `SELECT * FROM txs WHERE from_addr = $a OR to_addr = $a OR contract_address = $a
       ORDER BY block_number DESC, tx_index DESC LIMIT $limit OFFSET $offset`
    )
    .all({ $a: address, $limit: limit, $offset: offset });
}

export function addressTxCount(address) {
  return db()
    .prepare("SELECT COUNT(*) AS n FROM txs WHERE from_addr = $a OR to_addr = $a OR contract_address = $a")
    .get({ $a: address }).n;
}

export function contractCreation(address) {
  return db().prepare("SELECT hash, from_addr, block_number FROM txs WHERE contract_address = ?").get(address) || null;
}

export function blocksValidated(address) {
  return db().prepare("SELECT COUNT(*) AS n FROM blocks WHERE signer = ?").get(address).n;
}

const TRANSFER_SELECT = `SELECT tt.*, tk.name, tk.symbol, tk.decimals FROM token_transfers tt
  LEFT JOIN tokens tk ON tk.address = tt.token`;

export function tokenTransfers({ token = null, address = null, txHash = null, limit = PAGE_SIZE, offset = 0 } = {}) {
  if (txHash) return db().prepare(`${TRANSFER_SELECT} WHERE tt.tx_hash = ? ORDER BY tt.log_index`).all(txHash);
  if (token) {
    return db()
      .prepare(`${TRANSFER_SELECT} WHERE tt.token = ? ORDER BY tt.block_number DESC, tt.log_index DESC LIMIT ? OFFSET ?`)
      .all(token, limit, offset);
  }
  if (address) {
    return db()
      .prepare(
        `${TRANSFER_SELECT} WHERE tt.from_addr = $a OR tt.to_addr = $a
         ORDER BY tt.block_number DESC, tt.log_index DESC LIMIT $limit OFFSET $offset`
      )
      .all({ $a: address, $limit: limit, $offset: offset });
  }
  return db()
    .prepare(`${TRANSFER_SELECT} ORDER BY tt.block_number DESC, tt.log_index DESC LIMIT ? OFFSET ?`)
    .all(limit, offset);
}

export function tokenTransferCount({ token = null, address = null } = {}) {
  if (token) return db().prepare("SELECT COUNT(*) AS n FROM token_transfers WHERE token = ?").get(token).n;
  if (address) {
    return db()
      .prepare("SELECT COUNT(*) AS n FROM token_transfers WHERE from_addr = $a OR to_addr = $a")
      .get({ $a: address }).n;
  }
  return db().prepare("SELECT COUNT(*) AS n FROM token_transfers").get().n;
}

export function tokenList() {
  return db()
    .prepare(
      `SELECT tk.*, COUNT(tt.tx_hash) AS transfers, MAX(tt.block_number) AS last_block
       FROM tokens tk LEFT JOIN token_transfers tt ON tt.token = tk.address
       GROUP BY tk.address ORDER BY transfers DESC`
    )
    .all();
}

export function tokenInfo(address) {
  return db().prepare("SELECT * FROM tokens WHERE address = ?").get(address) || null;
}

/** Net balances computed from indexed transfers (ERC-20 amounts, ERC-721 counts). */
function netBalances(rows, keyFn, tokenType) {
  const balances = new Map();
  const bump = (key, delta) => balances.set(key, (balances.get(key) || 0n) + delta);
  for (const row of rows) {
    const amount = tokenType(row) === "ERC-721" ? 1n : BigInt(row.value);
    const [fromKey, toKey] = keyFn(row);
    if (fromKey) bump(fromKey, -amount);
    if (toKey) bump(toKey, amount);
  }
  return balances;
}

const ZERO = "0x0000000000000000000000000000000000000000";

export function tokenHolders(token, tokenType, limit = 50) {
  const rows = db().prepare("SELECT from_addr, to_addr, value FROM token_transfers WHERE token = ?").all(token);
  const balances = netBalances(
    rows,
    (row) => [row.from_addr === ZERO ? null : row.from_addr, row.to_addr === ZERO ? null : row.to_addr],
    () => tokenType
  );
  return [...balances.entries()]
    .filter(([, value]) => value > 0n)
    .sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0))
    .slice(0, limit)
    .map(([address, balance]) => ({ address, balance }));
}

export function addressTokenBalances(address) {
  const rows = db()
    .prepare(
      `SELECT tt.token, tt.token_type, tt.from_addr, tt.to_addr, tt.value FROM token_transfers tt
       WHERE tt.from_addr = $a OR tt.to_addr = $a`
    )
    .all({ $a: address });
  const balances = netBalances(
    rows,
    (row) => [row.from_addr === address ? row.token : null, row.to_addr === address ? row.token : null],
    (row) => row.token_type
  );
  const info = db().prepare("SELECT * FROM tokens WHERE address = ?");
  return [...balances.entries()]
    .filter(([, value]) => value > 0n)
    .map(([token, balance]) => ({ token, balance, ...(info.get(token) || { token_type: "ERC-20", decimals: 18 }) }));
}

export function topAccounts(limit = 50) {
  return db()
    .prepare(
      `SELECT addr AS address, COUNT(*) AS tx_count, MAX(block_number) AS last_block FROM (
         SELECT from_addr AS addr, block_number FROM txs
         UNION ALL SELECT to_addr, block_number FROM txs WHERE to_addr IS NOT NULL
       ) GROUP BY addr ORDER BY tx_count DESC LIMIT ?`
    )
    .all(limit);
}

export function validators() {
  return db()
    .prepare(
      `SELECT signer AS address, COUNT(*) AS blocks, MAX(number) AS last_block, MAX(timestamp) AS last_seen
       FROM blocks WHERE number > 0 AND signer IS NOT NULL GROUP BY signer ORDER BY blocks DESC`
    )
    .all();
}

export function avgBlockTime(sample = 100) {
  const row = db()
    .prepare(
      `SELECT MAX(timestamp) AS hi, MIN(timestamp) AS lo, COUNT(*) AS n
       FROM (SELECT timestamp FROM blocks WHERE number > 0 ORDER BY number DESC LIMIT ?)`
    )
    .get(sample);
  if (!row || row.n < 2) return null;
  return (row.hi - row.lo) / (row.n - 1);
}

export function txHistory(days = 14) {
  const now = Math.floor(Date.now() / 1000);
  const today = Math.floor(now / 86400);
  const rows = db()
    .prepare("SELECT timestamp / 86400 AS day, COUNT(*) AS n FROM txs WHERE timestamp >= ? GROUP BY day")
    .all((today - days + 1) * 86400);
  const counts = new Map(rows.map((row) => [row.day, row.n]));
  return Array.from({ length: days }, (_, i) => {
    const day = today - days + 1 + i;
    return { day, date: new Date(day * 86400 * 1000), count: counts.get(day) || 0 };
  });
}
