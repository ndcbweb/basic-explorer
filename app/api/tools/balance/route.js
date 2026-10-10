import { decodeFunctionResult, encodeFunctionData, formatUnits, parseAbi } from "viem";
import { db } from "@/lib/db";
import { isAddress } from "@/lib/format";
import { rpc, rpcBatch, toHex } from "@/lib/rpc";

export const dynamic = "force-dynamic";

const ERC20 = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]);

function decode(functionName, data) {
  if (!data || data === "0x") return null;
  try {
    return decodeFunctionResult({ abi: ERC20, functionName, data });
  } catch {
    return null;
  }
}

function fail(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const address = (params.get("address") || "").trim().toLowerCase();
  const token = (params.get("token") || "").trim().toLowerCase();
  const blockParam = (params.get("block") || "").trim();
  const dateParam = (params.get("date") || "").trim();

  if (!isAddress(address)) return fail("Enter a valid 0x address.");
  if (token && !isAddress(token)) return fail("The token contract must be a valid 0x address.");

  let head;
  try {
    head = Number(BigInt(await rpc("eth_blockNumber")));
  } catch (error) {
    return fail(`Node request failed: ${error.message}`, 502);
  }

  let blockNumber;
  if (blockParam) {
    if (!/^\d+$/.test(blockParam)) return fail("Block number must be a whole number.");
    blockNumber = Number(blockParam);
    if (blockNumber > head) return fail(`Block ${blockNumber} has not been produced yet (latest is ${head}).`);
  } else if (dateParam) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return fail("Date must be YYYY-MM-DD.");
    // End-of-day snapshot: the last block produced on or before 23:59:59 UTC of that date.
    const cutoff = Math.floor(Date.parse(`${dateParam}T23:59:59Z`) / 1000);
    if (Number.isNaN(cutoff)) return fail("Date is not valid.");
    const row = db().prepare("SELECT number FROM blocks WHERE timestamp <= ? ORDER BY timestamp DESC LIMIT 1").get(cutoff);
    if (!row) return fail("No indexed block exists on or before that date.", 404);
    blockNumber = row.number;
  } else {
    return fail("Provide either a block number or a date.");
  }

  const tag = toHex(blockNumber);
  const calls = [
    ["eth_getBalance", [address, tag]],
    ["eth_getBlockByNumber", [tag, false]],
  ];
  if (token) {
    const call = (functionName, args) => ["eth_call", [{ to: token, data: encodeFunctionData({ abi: ERC20, functionName, args }) }, tag]];
    calls.push(call("balanceOf", [address]), call("decimals"), call("symbol"), call("name"));
  }

  let results;
  try {
    results = await rpcBatch(calls);
  } catch (error) {
    return fail(`Node request failed: ${error.message}`, 502);
  }
  const [balanceHex, block, tokenBalance, tokenDecimals, tokenSymbol, tokenName] = results;
  if (balanceHex == null) return fail("The node could not return the balance at that block (is it an archive node?).", 502);

  const balance = BigInt(balanceHex);
  const body = {
    address,
    blockNumber,
    timestamp: block?.timestamp ? Number(BigInt(block.timestamp)) : null,
    balance: balance.toString(),
    balanceFormatted: formatUnits(balance, 18),
  };

  if (token) {
    const known = db().prepare("SELECT name, symbol, decimals FROM tokens WHERE address = ?").get(token);
    const raw = decode("balanceOf", tokenBalance);
    const decimals = Number(decode("decimals", tokenDecimals) ?? known?.decimals ?? 18);
    body.token = {
      address: token,
      name: decode("name", tokenName) ?? known?.name ?? null,
      symbol: decode("symbol", tokenSymbol) ?? known?.symbol ?? null,
      decimals,
      balance: raw == null ? null : raw.toString(),
      balanceFormatted: raw == null ? null : formatUnits(raw, decimals),
      error: raw == null ? "balanceOf() failed at this block — the contract may not exist yet or is not an ERC-20 token." : null,
    };
  }

  return Response.json(body);
}
