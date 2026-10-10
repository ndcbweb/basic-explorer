import { config } from "./config";
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

export function tokenTransfers({ token = null, address = null, txHash = null, type = null, limit = PAGE_SIZE, offset = 0 } = {}) {
  if (type && !token && !address && !txHash) {
    return db()
      .prepare(`${TRANSFER_SELECT} WHERE tt.token_type = ? ORDER BY tt.block_number DESC, tt.log_index DESC LIMIT ? OFFSET ?`)
      .all(type, limit, offset);
  }
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

export function tokenTransferCount({ token = null, address = null, type = null } = {}) {
  if (type && !token && !address) {
    return db().prepare("SELECT COUNT(*) AS n FROM token_transfers WHERE token_type = ?").get(type).n;
  }
  if (token) return db().prepare("SELECT COUNT(*) AS n FROM token_transfers WHERE token = ?").get(token).n;
  if (address) {
    return db()
      .prepare("SELECT COUNT(*) AS n FROM token_transfers WHERE from_addr = $a OR to_addr = $a")
      .get({ $a: address }).n;
  }
  return db().prepare("SELECT COUNT(*) AS n FROM token_transfers").get().n;
}

export function tokenList({ type = null } = {}) {
  return db()
    .prepare(
      `SELECT tk.*, COUNT(tt.tx_hash) AS transfers, MAX(tt.block_number) AS last_block,
         COUNT(DISTINCT tt.to_addr) AS recipients
       FROM tokens tk LEFT JOIN token_transfers tt ON tt.token = tk.address
       WHERE $type IS NULL OR tk.token_type = $type
       GROUP BY tk.address ORDER BY transfers DESC`
    )
    .all({ $type: type });
}

/** Per-day aggregates for the charts page. */
export function dailyStats(days = 30) {
  const today = Math.floor(Date.now() / 1000 / 86400);
  const from = (today - days + 1) * 86400;
  const blocks = db()
    .prepare(
      `SELECT timestamp / 86400 AS day, COUNT(*) AS blocks, SUM(tx_count) AS txs,
         SUM(CAST(gas_used AS REAL)) AS gas, MIN(timestamp) AS lo, MAX(timestamp) AS hi
       FROM blocks WHERE number > 0 AND timestamp >= ? GROUP BY day`
    )
    .all(from);
  const senders = db()
    .prepare("SELECT timestamp / 86400 AS day, COUNT(DISTINCT from_addr) AS n FROM txs WHERE timestamp >= ? GROUP BY day")
    .all(from);
  const byDay = new Map(blocks.map((row) => [row.day, row]));
  const active = new Map(senders.map((row) => [row.day, row.n]));
  return Array.from({ length: days }, (_, i) => {
    const day = today - days + 1 + i;
    const row = byDay.get(day);
    return {
      day,
      date: new Date(day * 86400 * 1000),
      blocks: row?.blocks || 0,
      txs: row?.txs || 0,
      gas: row?.gas || 0,
      blockTime: row && row.blocks > 1 ? (row.hi - row.lo) / (row.blocks - 1) : 0,
      activeAddresses: active.get(day) || 0,
    };
  });
}

export function chainTotals() {
  const row = db()
    .prepare(
      `SELECT (SELECT COUNT(*) FROM blocks) AS blocks, (SELECT COUNT(*) FROM txs) AS txs,
         (SELECT COUNT(*) FROM tokens) AS tokens, (SELECT COUNT(*) FROM token_transfers) AS transfers,
         (SELECT COUNT(*) FROM txs WHERE contract_address IS NOT NULL) AS contracts`
    )
    .get();
  return row;
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
  const active = db()
    .prepare(
      `SELECT addr AS address, COUNT(*) AS tx_count, MAX(block_number) AS last_block FROM (
         SELECT from_addr AS addr, block_number FROM txs
         UNION ALL SELECT to_addr, block_number FROM txs WHERE to_addr IS NOT NULL
       ) GROUP BY addr ORDER BY tx_count DESC LIMIT ?`
    )
    .all(limit);
  const seen = new Set(active.map((row) => String(row.address).toLowerCase()));
  const genesis = config.genesisAccounts
    .filter((address) => !seen.has(address))
    .map((address) => ({ address, tx_count: 0, last_block: 0 }));
  return [...genesis, ...active].slice(0, limit);
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

/** Transactions per second across the most recent blocks. */
export function recentTps(sample = 100) {
  const row = db()
    .prepare(
      `SELECT MAX(timestamp) AS hi, MIN(timestamp) AS lo, SUM(tx_count) AS txs, COUNT(*) AS n
       FROM (SELECT timestamp, tx_count FROM blocks WHERE number > 0 ORDER BY number DESC LIMIT ?)`
    )
    .get(sample);
  if (!row || row.n < 2 || row.hi === row.lo) return 0;
  return row.txs / (row.hi - row.lo);
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

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
/** ERC-4337 EntryPoint deployments (v0.6, v0.7) at their canonical CREATE2 addresses. */
export const ENTRY_POINTS = ["0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789", "0x0000000071727de22e5e9d8baf0edac6f37da032"];

export function internalTxs({ address = null, limit = PAGE_SIZE, offset = 0 } = {}) {
  if (address) {
    return db()
      .prepare(
        `SELECT * FROM internal_txs WHERE from_addr = $a OR to_addr = $a
         ORDER BY block_number DESC, tx_hash, idx LIMIT $limit OFFSET $offset`
      )
      .all({ $a: address, $limit: limit, $offset: offset });
  }
  return db().prepare("SELECT * FROM internal_txs ORDER BY block_number DESC, tx_hash, idx LIMIT ? OFFSET ?").all(limit, offset);
}

export function internalTxCount({ address = null } = {}) {
  if (address) {
    return db().prepare("SELECT COUNT(*) AS n FROM internal_txs WHERE from_addr = $a OR to_addr = $a").get({ $a: address }).n;
  }
  return db().prepare("SELECT COUNT(*) AS n FROM internal_txs").get().n;
}

export function txInternalCalls(hash) {
  return db().prepare("SELECT * FROM internal_txs WHERE tx_hash = ? ORDER BY idx").all(hash);
}

export function txsByType(type, { limit = PAGE_SIZE, offset = 0 } = {}) {
  return db()
    .prepare("SELECT * FROM txs WHERE tx_type = ? ORDER BY block_number DESC, tx_index DESC LIMIT ? OFFSET ?")
    .all(type, limit, offset);
}

export function txsByTypeCount(type) {
  return db().prepare("SELECT COUNT(*) AS n FROM txs WHERE tx_type = ?").get(type).n;
}

export function aaTxs({ limit = PAGE_SIZE, offset = 0 } = {}) {
  const marks = ENTRY_POINTS.map(() => "?").join(",");
  return db()
    .prepare(`SELECT * FROM txs WHERE to_addr IN (${marks}) ORDER BY block_number DESC, tx_index DESC LIMIT ? OFFSET ?`)
    .all(...ENTRY_POINTS, limit, offset);
}

export function aaTxCount() {
  const marks = ENTRY_POINTS.map(() => "?").join(",");
  return db().prepare(`SELECT COUNT(*) AS n FROM txs WHERE to_addr IN (${marks})`).get(...ENTRY_POINTS).n;
}

export function forkedBlocks({ limit = PAGE_SIZE, offset = 0 } = {}) {
  return db().prepare("SELECT * FROM reorgs ORDER BY number DESC, detected_at DESC LIMIT ? OFFSET ?").all(limit, offset);
}

export function forkedBlockCount() {
  return db().prepare("SELECT COUNT(*) AS n FROM reorgs").get().n;
}

export function beaconWithdrawals({ limit = PAGE_SIZE, offset = 0 } = {}) {
  return db().prepare("SELECT * FROM withdrawals ORDER BY block_number DESC, idx DESC LIMIT ? OFFSET ?").all(limit, offset);
}

export function beaconWithdrawalCount() {
  return db().prepare("SELECT COUNT(*) AS n FROM withdrawals").get().n;
}

export function nftMints({ limit = PAGE_SIZE, offset = 0 } = {}) {
  return db()
    .prepare(`${TRANSFER_SELECT} WHERE tt.token_type = 'ERC-721' AND tt.from_addr = ? ORDER BY tt.block_number DESC, tt.log_index DESC LIMIT ? OFFSET ?`)
    .all(ZERO_ADDR, limit, offset);
}

export function nftMintCount() {
  return db().prepare("SELECT COUNT(*) AS n FROM token_transfers WHERE token_type = 'ERC-721' AND from_addr = ?").get(ZERO_ADDR).n;
}

export function nftTopMints(sinceTs) {
  return db()
    .prepare(
      `SELECT tt.token AS address, tk.name, tk.symbol, COUNT(*) AS mints, COUNT(DISTINCT tt.to_addr) AS minters,
         MAX(tt.timestamp) AS last_mint
       FROM token_transfers tt LEFT JOIN tokens tk ON tk.address = tt.token
       WHERE tt.token_type = 'ERC-721' AND tt.from_addr = ? AND tt.timestamp >= ?
       GROUP BY tt.token ORDER BY mints DESC LIMIT 50`
    )
    .all(ZERO_ADDR, sinceTs);
}

/** NFT transfers whose transaction also moved native currency: the closest on-chain signal of a sale. */
export function nftTrades({ limit = PAGE_SIZE, offset = 0 } = {}) {
  return db()
    .prepare(
      `SELECT tt.*, tk.name, tk.symbol, t.value AS price, t.from_addr AS buyer
       FROM token_transfers tt JOIN txs t ON t.hash = tt.tx_hash LEFT JOIN tokens tk ON tk.address = tt.token
       WHERE tt.token_type = 'ERC-721' AND tt.from_addr != ? AND t.value != '0'
       ORDER BY tt.block_number DESC, tt.log_index DESC LIMIT ? OFFSET ?`
    )
    .all(ZERO_ADDR, limit, offset);
}

export function nftTradeCount() {
  return db()
    .prepare(
      `SELECT COUNT(*) AS n FROM token_transfers tt JOIN txs t ON t.hash = tt.tx_hash
       WHERE tt.token_type = 'ERC-721' AND tt.from_addr != ? AND t.value != '0'`
    )
    .get(ZERO_ADDR).n;
}

export function topStatistics(sinceTs) {
  const q = (sql) => db().prepare(sql).all({ $since: sinceTs });
  return {
    senders: q(`SELECT from_addr AS address, COUNT(*) AS n FROM txs WHERE timestamp >= $since GROUP BY from_addr ORDER BY n DESC LIMIT 10`),
    receivers: q(
      `SELECT to_addr AS address, COUNT(*) AS n FROM txs WHERE timestamp >= $since AND to_addr IS NOT NULL GROUP BY to_addr ORDER BY n DESC LIMIT 10`
    ),
    valueSent: q(
      `SELECT from_addr AS address, SUM(CAST(value AS REAL)) AS total FROM txs WHERE timestamp >= $since
       GROUP BY from_addr HAVING total > 0 ORDER BY total DESC LIMIT 10`
    ),
    valueReceived: q(
      `SELECT to_addr AS address, SUM(CAST(value AS REAL)) AS total FROM txs WHERE timestamp >= $since AND to_addr IS NOT NULL
       GROUP BY to_addr HAVING total > 0 ORDER BY total DESC LIMIT 10`
    ),
    feePayers: q(
      `SELECT from_addr AS address, SUM(CAST(fee AS REAL)) AS total FROM txs WHERE timestamp >= $since
       GROUP BY from_addr HAVING total > 0 ORDER BY total DESC LIMIT 10`
    ),
    gasUsers: q(
      `SELECT to_addr AS address, SUM(CAST(gas_used AS REAL)) AS total FROM txs WHERE timestamp >= $since AND to_addr IS NOT NULL
       GROUP BY to_addr HAVING total > 0 ORDER BY total DESC LIMIT 10`
    ),
    tokens: q(
      `SELECT tt.token AS address, tk.name, tk.symbol, COUNT(*) AS n FROM token_transfers tt LEFT JOIN tokens tk ON tk.address = tt.token
       WHERE tt.timestamp >= $since GROUP BY tt.token ORDER BY n DESC LIMIT 10`
    ),
    tokenSenders: q(
      `SELECT from_addr AS address, COUNT(*) AS n FROM token_transfers WHERE timestamp >= $since GROUP BY from_addr ORDER BY n DESC LIMIT 10`
    ),
  };
}

const CONTRACT_SET = "SELECT contract_address FROM txs WHERE contract_address IS NOT NULL";

export function contractLeaderboard(sinceTs, limit = 50) {
  return db()
    .prepare(
      `SELECT t.to_addr AS address, COUNT(*) AS txs, COUNT(DISTINCT t.from_addr) AS users,
         SUM(CAST(t.gas_used AS REAL)) AS gas, SUM(CAST(t.fee AS REAL)) AS fees, tk.name, tk.symbol, tk.token_type
       FROM txs t LEFT JOIN tokens tk ON tk.address = t.to_addr
       WHERE t.timestamp >= ? AND t.to_addr IN (${CONTRACT_SET})
       GROUP BY t.to_addr ORDER BY users DESC, txs DESC LIMIT ?`
    )
    .all(sinceTs, limit);
}

export function deployedContracts(limit = 200) {
  return db()
    .prepare(
      `SELECT t.contract_address AS address, t.from_addr AS creator, t.hash, t.block_number, t.timestamp,
         tk.name, tk.symbol, tk.token_type,
         (SELECT COUNT(*) FROM txs x WHERE x.to_addr = t.contract_address) AS calls
       FROM txs t LEFT JOIN tokens tk ON tk.address = t.contract_address
       WHERE t.contract_address IS NOT NULL ORDER BY calls DESC, t.block_number DESC LIMIT ?`
    )
    .all(limit);
}

export function labelCounts() {
  const one = (sql) => db().prepare(sql).get().n;
  return [
    { id: "validator", label: "Validator", count: one("SELECT COUNT(DISTINCT signer) AS n FROM blocks WHERE number > 0 AND signer IS NOT NULL") },
    { id: "erc20", label: "Token Contract (ERC-20)", count: one("SELECT COUNT(*) AS n FROM tokens WHERE token_type = 'ERC-20'") },
    { id: "erc721", label: "NFT Contract (ERC-721)", count: one("SELECT COUNT(*) AS n FROM tokens WHERE token_type = 'ERC-721'") },
    { id: "contract", label: "Smart Contract", count: one("SELECT COUNT(*) AS n FROM txs WHERE contract_address IS NOT NULL") },
    { id: "deployer", label: "Contract Deployer", count: one("SELECT COUNT(DISTINCT from_addr) AS n FROM txs WHERE contract_address IS NOT NULL") },
    { id: "aa", label: "ERC-4337 EntryPoint User", count: aaTxCount() },
  ];
}

export function labelMembers(id, limit = 100) {
  const sql = {
    validator: "SELECT signer AS address, COUNT(*) AS n FROM blocks WHERE number > 0 AND signer IS NOT NULL GROUP BY signer ORDER BY n DESC",
    erc20: "SELECT address, name, symbol FROM tokens WHERE token_type = 'ERC-20' ORDER BY name",
    erc721: "SELECT address, name, symbol FROM tokens WHERE token_type = 'ERC-721' ORDER BY name",
    contract: "SELECT contract_address AS address, block_number AS n FROM txs WHERE contract_address IS NOT NULL ORDER BY block_number DESC",
    deployer: "SELECT from_addr AS address, COUNT(*) AS n FROM txs WHERE contract_address IS NOT NULL GROUP BY from_addr ORDER BY n DESC",
    aa: `SELECT from_addr AS address, COUNT(*) AS n FROM txs WHERE to_addr IN (${ENTRY_POINTS.map((a) => `'${a}'`).join(",")}) GROUP BY from_addr ORDER BY n DESC`,
  }[id];
  return sql ? db().prepare(`${sql} LIMIT ?`).all(limit) : [];
}

/** Token flows into and out of an address, aggregated per counterparty. */
export function tokenFlow(address, token = null) {
  const rows = db()
    .prepare(
      `SELECT tt.token, tt.token_type, tt.from_addr, tt.to_addr, tt.value, tk.name, tk.symbol, tk.decimals
       FROM token_transfers tt LEFT JOIN tokens tk ON tk.address = tt.token
       WHERE (tt.from_addr = $a OR tt.to_addr = $a) AND ($t IS NULL OR tt.token = $t)`
    )
    .all({ $a: address, $t: token });
  const flows = new Map();
  for (const row of rows) {
    const inbound = row.to_addr === address;
    const counterparty = inbound ? row.from_addr : row.to_addr;
    const key = `${inbound ? "in" : "out"}|${counterparty}|${row.token}`;
    const amount = row.token_type === "ERC-721" ? 1n : BigInt(row.value);
    const prev = flows.get(key) || { direction: inbound ? "in" : "out", counterparty, token: row.token, name: row.name, symbol: row.symbol, decimals: row.token_type === "ERC-721" ? 0 : row.decimals ?? 18, amount: 0n, count: 0 };
    prev.amount += amount;
    prev.count += 1;
    flows.set(key, prev);
  }
  const list = [...flows.values()].sort((a, b) => b.count - a.count);
  return { inflows: list.filter((f) => f.direction === "in"), outflows: list.filter((f) => f.direction === "out"), tokens: [...new Map(rows.map((r) => [r.token, { address: r.token, name: r.name, symbol: r.symbol }])).values()] };
}

export function recentBaseFees(limit = 60) {
  return db().prepare("SELECT number, timestamp, base_fee, gas_used, gas_limit FROM blocks ORDER BY number DESC LIMIT ?").all(limit).reverse();
}

export function gasGuzzlers(sinceTs, limit = 10) {
  return db()
    .prepare(
      `SELECT t.to_addr AS address, SUM(CAST(t.gas_used AS REAL)) AS gas, COUNT(*) AS txs, SUM(CAST(t.fee AS REAL)) AS fees, tk.name, tk.symbol
       FROM txs t LEFT JOIN tokens tk ON tk.address = t.to_addr
       WHERE t.timestamp >= ? AND t.to_addr IS NOT NULL GROUP BY t.to_addr ORDER BY gas DESC LIMIT ?`
    )
    .all(sinceTs, limit);
}
