import { formatUnits } from "viem";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { isAddress } from "@/lib/format";

export const dynamic = "force-dynamic";

const MAX_ROWS = 5000;
const TYPES = { txns: "transactions", internal: "internal-transactions", erc20: "erc20-transfers", nft: "nft-transfers" };
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function utcDate(ts) {
  return new Date(ts * 1000).toISOString().replace("T", " ").slice(0, 19);
}

const native = (raw) => (raw == null || raw === "" ? "0" : formatUnits(BigInt(raw), 18));

function rangeFilter(params, column = "block_number", tsColumn = "timestamp") {
  const where = [];
  const args = [];
  const startBlock = params.get("startblock");
  const endBlock = params.get("endblock");
  const startDate = params.get("startdate");
  const endDate = params.get("enddate");
  if (startBlock) {
    if (!/^\d+$/.test(startBlock)) throw new Error("startblock must be a block number.");
    where.push(`${column} >= ?`);
    args.push(Number(startBlock));
  }
  if (endBlock) {
    if (!/^\d+$/.test(endBlock)) throw new Error("endblock must be a block number.");
    where.push(`${column} <= ?`);
    args.push(Number(endBlock));
  }
  if (startDate) {
    if (!DATE.test(startDate)) throw new Error("startdate must be YYYY-MM-DD.");
    where.push(`${tsColumn} >= ?`);
    args.push(Math.floor(Date.parse(`${startDate}T00:00:00Z`) / 1000));
  }
  if (endDate) {
    if (!DATE.test(endDate)) throw new Error("enddate must be YYYY-MM-DD.");
    where.push(`${tsColumn} < ?`);
    args.push(Math.floor(Date.parse(`${endDate}T00:00:00Z`) / 1000) + 86400);
  }
  return { where, args };
}

function exportTxns(address, range) {
  const cur = config.currency;
  const rows = db()
    .prepare(
      `SELECT * FROM txs WHERE (from_addr = ? OR to_addr = ? OR contract_address = ?)
       ${range.where.map((w) => `AND ${w}`).join(" ")}
       ORDER BY block_number ASC, tx_index ASC LIMIT ${MAX_ROWS}`
    )
    .all(address, address, address, ...range.args);
  const header = ["Txhash", "Blockno", "UnixTimestamp", "DateTime (UTC)", "From", "To", "ContractAddress", `Value_IN(${cur})`, `Value_OUT(${cur})`, `TxnFee(${cur})`, "Status", "Method"];
  const body = rows.map((tx) => [
    tx.hash,
    tx.block_number,
    tx.timestamp,
    utcDate(tx.timestamp),
    tx.from_addr,
    tx.to_addr || "",
    tx.contract_address || "",
    tx.to_addr === address || tx.contract_address === address ? native(tx.value) : "0",
    tx.from_addr === address ? native(tx.value) : "0",
    tx.fee ? native(tx.fee) : "",
    tx.status === 0 ? "Error" : tx.status === 1 ? "Success" : "",
    tx.method || "",
  ]);
  return [header, ...body];
}

function exportInternal(address, range) {
  const cur = config.currency;
  const rows = db()
    .prepare(
      `SELECT * FROM internal_txs WHERE (from_addr = ? OR to_addr = ?)
       ${range.where.map((w) => `AND ${w}`).join(" ")}
       ORDER BY block_number ASC, idx ASC LIMIT ${MAX_ROWS}`
    )
    .all(address, address, ...range.args);
  const header = ["Txhash", "Blockno", "UnixTimestamp", "DateTime (UTC)", "From", "To", "ContractAddress", `Value_IN(${cur})`, `Value_OUT(${cur})`, "Type", "ErrCode"];
  const body = rows.map((row) => {
    const creates = /^create/i.test(row.call_type);
    return [
      row.tx_hash,
      row.block_number,
      row.timestamp,
      utcDate(row.timestamp),
      row.from_addr,
      creates ? "" : row.to_addr || "",
      creates ? row.to_addr || "" : "",
      row.to_addr === address ? native(row.value) : "0",
      row.from_addr === address ? native(row.value) : "0",
      row.call_type.toLowerCase(),
      row.error || "",
    ];
  });
  return [header, ...body];
}

function exportTransfers(address, range, tokenType) {
  const rows = db()
    .prepare(
      `SELECT t.*, k.name, k.symbol, k.decimals FROM token_transfers t LEFT JOIN tokens k ON k.address = t.token
       WHERE t.token_type = ? AND (t.from_addr = ? OR t.to_addr = ?)
       ${range.where.map((w) => `AND t.${w}`).join(" ")}
       ORDER BY t.block_number ASC, t.log_index ASC LIMIT ${MAX_ROWS}`
    )
    .all(tokenType, address, address, ...range.args);
  if (tokenType === "ERC-20") {
    const header = ["Txhash", "Blockno", "UnixTimestamp", "DateTime (UTC)", "From", "To", "TokenValue", "ContractAddress", "TokenName", "TokenSymbol"];
    const body = rows.map((row) => [
      row.tx_hash,
      row.block_number,
      row.timestamp,
      utcDate(row.timestamp),
      row.from_addr,
      row.to_addr,
      formatUnits(BigInt(row.value), row.decimals ?? 18),
      row.token,
      row.name || "",
      row.symbol || "",
    ]);
    return [header, ...body];
  }
  const header = ["Txhash", "Blockno", "UnixTimestamp", "DateTime (UTC)", "From", "To", "ContractAddress", "TokenId", "TokenName", "TokenSymbol", "Type"];
  const body = rows.map((row) => [
    row.tx_hash,
    row.block_number,
    row.timestamp,
    utcDate(row.timestamp),
    row.from_addr,
    row.to_addr,
    row.token,
    row.value,
    row.name || "",
    row.symbol || "",
    row.token_type,
  ]);
  return [header, ...body];
}

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const type = params.get("type") || "txns";
  const address = (params.get("address") || "").trim().toLowerCase();
  if (!TYPES[type]) return Response.json({ error: `Unknown export type. Use one of: ${Object.keys(TYPES).join(", ")}.` }, { status: 400 });
  if (!isAddress(address)) return Response.json({ error: "Enter a valid 0x address." }, { status: 400 });

  let rows;
  try {
    const range = rangeFilter(params);
    if (type === "txns") rows = exportTxns(address, range);
    else if (type === "internal") rows = exportInternal(address, range);
    else rows = exportTransfers(address, range, type === "erc20" ? "ERC-20" : "ERC-721");
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  const csv = `${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="export-${TYPES[type]}-${address}.csv"`,
      "cache-control": "no-store",
      "x-export-rows": String(rows.length - 1),
    },
  });
}
