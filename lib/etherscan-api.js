import { db } from "./db";
import { isAddress, isHash } from "./format";
import { indexerStatus } from "./indexer";
import { rpc, rpcBatch } from "./rpc";

const ok = (result) => ({ status: "1", message: "OK", result });
const fail = (message, result = null) => ({ status: "0", message: "NOTOK", result: result ?? message });
const empty = (message = "No transactions found") => ({ status: "0", message, result: [] });

const lower = (value) => (value || "").trim().toLowerCase();

function paging(params, max = 1000) {
  const page = Math.max(1, Number.parseInt(params.page, 10) || 1);
  const offset = Math.min(max, Math.max(1, Number.parseInt(params.offset, 10) || 100));
  return { limit: offset, skip: (page - 1) * offset };
}

function blockRange(params) {
  const start = Number.parseInt(params.startblock, 10);
  const end = Number.parseInt(params.endblock, 10);
  return { start: Number.isFinite(start) ? start : 0, end: Number.isFinite(end) ? end : Number.MAX_SAFE_INTEGER };
}

function confirmations(blockNumber) {
  const { head, indexed } = indexerStatus();
  return String(Math.max(0, (head ?? indexed) - blockNumber + 1));
}

function txRow(tx) {
  const selector = /^0x[0-9a-f]{8}$/.test(tx.method || "") ? tx.method : "0x";
  return {
    blockNumber: String(tx.block_number),
    timeStamp: String(tx.timestamp),
    hash: tx.hash,
    transactionIndex: String(tx.tx_index),
    from: tx.from_addr,
    to: tx.to_addr || "",
    value: tx.value,
    gasPrice: tx.gas_price || "0",
    gasUsed: tx.gas_used || "0",
    isError: tx.status === 0 ? "1" : "0",
    txreceipt_status: tx.status == null ? "" : String(tx.status),
    contractAddress: tx.contract_address || "",
    methodId: selector,
    functionName: selector === "0x" ? tx.method || "" : "",
    confirmations: confirmations(tx.block_number),
  };
}

async function account(action, params) {
  const address = lower(params.address);
  const tag = params.tag || "latest";

  if (action === "balance") {
    if (!isAddress(address)) return fail("Error! Invalid address format");
    return ok(BigInt(await rpc("eth_getBalance", [address, tag])).toString());
  }

  if (action === "balancemulti") {
    const list = address.split(",").map((a) => a.trim()).filter(Boolean).slice(0, 20);
    if (!list.length || !list.every(isAddress)) return fail("Error! Invalid address format");
    const balances = await rpcBatch(list.map((a) => ["eth_getBalance", [a, tag]]));
    return ok(list.map((a, i) => ({ account: a, balance: balances[i] ? BigInt(balances[i]).toString() : "0" })));
  }

  if (action === "txlist") {
    if (!isAddress(address)) return fail("Error! Invalid address format");
    const { limit, skip } = paging(params);
    const { start, end } = blockRange(params);
    const order = lower(params.sort) === "desc" ? "DESC" : "ASC";
    const rows = db()
      .prepare(
        `SELECT * FROM txs WHERE (from_addr = $a OR to_addr = $a OR contract_address = $a)
           AND block_number BETWEEN $start AND $end
         ORDER BY block_number ${order}, tx_index ${order} LIMIT $limit OFFSET $skip`
      )
      .all({ $a: address, $start: start, $end: end, $limit: limit, $skip: skip });
    return rows.length ? ok(rows.map(txRow)) : empty();
  }

  if (action === "tokentx" || action === "tokennfttx") {
    const contract = lower(params.contractaddress);
    if (address && !isAddress(address)) return fail("Error! Invalid address format");
    if (contract && !isAddress(contract)) return fail("Error! Invalid contract address format");
    if (!address && !contract) return fail("Error! Missing address or contractaddress");
    const { limit, skip } = paging(params);
    const { start, end } = blockRange(params);
    const order = lower(params.sort) === "desc" ? "DESC" : "ASC";
    const type = action === "tokennfttx" ? "ERC-721" : "ERC-20";
    const rows = db()
      .prepare(
        `SELECT tt.*, tk.name, tk.symbol, tk.decimals FROM token_transfers tt
         LEFT JOIN tokens tk ON tk.address = tt.token
         WHERE tt.token_type = $type AND tt.block_number BETWEEN $start AND $end
           AND ($a = '' OR tt.from_addr = $a OR tt.to_addr = $a)
           AND ($c = '' OR tt.token = $c)
         ORDER BY tt.block_number ${order}, tt.log_index ${order} LIMIT $limit OFFSET $skip`
      )
      .all({ $type: type, $start: start, $end: end, $a: address, $c: contract, $limit: limit, $skip: skip });
    if (!rows.length) return empty();
    return ok(
      rows.map((row) => ({
        blockNumber: String(row.block_number),
        timeStamp: String(row.timestamp),
        hash: row.tx_hash,
        logIndex: String(row.log_index),
        from: row.from_addr,
        to: row.to_addr,
        contractAddress: row.token,
        ...(type === "ERC-721" ? { tokenID: row.value } : { value: row.value }),
        tokenName: row.name || "",
        tokenSymbol: row.symbol || "",
        tokenDecimal: type === "ERC-721" ? "0" : String(row.decimals ?? 18),
        confirmations: confirmations(row.block_number),
      }))
    );
  }

  if (action === "tokenbalance") {
    const contract = lower(params.contractaddress);
    if (!isAddress(address) || !isAddress(contract)) return fail("Error! Invalid address format");
    const data = `0x70a08231${address.slice(2).padStart(64, "0")}`;
    const raw = await rpc("eth_call", [{ to: contract, data }, tag]);
    return ok(raw && raw !== "0x" ? BigInt(raw).toString() : "0");
  }

  if (action === "getminedblocks") {
    if (!isAddress(address)) return fail("Error! Invalid address format");
    const { limit, skip } = paging(params);
    const rows = db()
      .prepare("SELECT number, timestamp FROM blocks WHERE signer = ? ORDER BY number DESC LIMIT ? OFFSET ?")
      .all(address, limit, skip);
    if (!rows.length) return empty("No blocks found");
    return ok(rows.map((row) => ({ blockNumber: String(row.number), timeStamp: String(row.timestamp), blockReward: "0" })));
  }

  return fail("Error! Invalid action");
}

async function transaction(action, params) {
  const hash = lower(params.txhash);
  if (!isHash(hash)) return fail("Error! Invalid transaction hash");
  const receipt = await rpc("eth_getTransactionReceipt", [hash]);
  if (action === "gettxreceiptstatus") {
    return ok({ status: receipt?.status != null ? String(Number(BigInt(receipt.status))) : "" });
  }
  if (action === "getstatus") {
    const failed = receipt?.status != null && BigInt(receipt.status) === 0n;
    return ok({ isError: failed ? "1" : "0", errDescription: failed ? "Execution reverted" : "" });
  }
  return fail("Error! Invalid action");
}

async function block(action, params) {
  if (action === "getblocknobytime") {
    const ts = Number.parseInt(params.timestamp, 10);
    if (!Number.isFinite(ts)) return fail("Error! Invalid timestamp");
    const before = lower(params.closest) !== "after";
    const row = db()
      .prepare(
        before
          ? "SELECT number FROM blocks WHERE timestamp <= ? ORDER BY timestamp DESC LIMIT 1"
          : "SELECT number FROM blocks WHERE timestamp >= ? ORDER BY timestamp ASC LIMIT 1"
      )
      .get(ts);
    return row ? ok(String(row.number)) : fail("Error! No closest block found");
  }
  return fail("Error! Invalid action");
}

async function stats(action, params) {
  if (action === "tokensupply") {
    const contract = lower(params.contractaddress);
    if (!isAddress(contract)) return fail("Error! Invalid contract address format");
    const raw = await rpc("eth_call", [{ to: contract, data: "0x18160ddd" }, "latest"]);
    return ok(raw && raw !== "0x" ? BigInt(raw).toString() : "0");
  }
  if (action === "chainsize" || action === "dailytx") {
    const row = db().prepare("SELECT COUNT(*) AS blocks, (SELECT COUNT(*) FROM txs) AS txs FROM blocks").get();
    return ok({ blocks: String(row.blocks), transactions: String(row.txs) });
  }
  return fail("Error! Invalid action");
}

const PROXY = {
  eth_blockNumber: () => [],
  eth_getBlockByNumber: (p) => [p.tag || "latest", p.boolean === "true"],
  eth_getBlockTransactionCountByNumber: (p) => [p.tag || "latest"],
  eth_getTransactionByHash: (p) => [p.txhash],
  eth_getTransactionByBlockNumberAndIndex: (p) => [p.tag, p.index],
  eth_getTransactionCount: (p) => [p.address, p.tag || "latest"],
  eth_sendRawTransaction: (p) => [p.hex],
  eth_getTransactionReceipt: (p) => [p.txhash],
  eth_call: (p) => [{ to: p.to, data: p.data }, p.tag || "latest"],
  eth_getCode: (p) => [p.address, p.tag || "latest"],
  eth_getStorageAt: (p) => [p.address, p.position, p.tag || "latest"],
  eth_gasPrice: () => [],
  eth_estimateGas: (p) => [{ to: p.to, data: p.data, value: p.value, from: p.from, gas: p.gas, gasPrice: p.gasPrice }],
  eth_chainId: () => [],
};

async function proxy(action, params) {
  const build = PROXY[action];
  if (!build) return { jsonrpc: "2.0", id: Number(params.id) || 1, error: { code: -32601, message: "Unsupported proxy action" } };
  try {
    const result = await rpc(action, build(params));
    return { jsonrpc: "2.0", id: Number(params.id) || 1, result };
  } catch (error) {
    return { jsonrpc: "2.0", id: Number(params.id) || 1, error: { code: -32000, message: error.message } };
  }
}

const MODULES = { account, transaction, block, stats, proxy };

export async function handleApi(params) {
  const handler = MODULES[lower(params.module)];
  if (!handler) return fail("Error! Missing Or invalid Module name");
  const action = (params.action || "").trim();
  if (!action) return fail("Error! Missing Or invalid Action name");
  try {
    return await handler(action, params);
  } catch (error) {
    return fail(error.message || "Error! Request failed");
  }
}
