import { decodeFunctionResult, encodeFunctionData, parseAbi } from "viem";
import { db } from "./db";
import { rpc, rpcBatch, toHex } from "./rpc";

export const APPROVAL_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925";
export const APPROVAL_FOR_ALL_TOPIC = "0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31";
export const UNLIMITED_THRESHOLD = 2n ** 255n;

const CHUNK = 50_000;
const BATCH = 10;

const ABI = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
]);

const topicAddress = (topic) => `0x${topic.slice(-40)}`.toLowerCase();

async function fetchLogs(ownerTopic, head) {
  const filter = (from, to) => ({ fromBlock: toHex(from), toBlock: toHex(to), topics: [[APPROVAL_TOPIC, APPROVAL_FOR_ALL_TOPIC], ownerTopic] });
  try {
    return await rpc("eth_getLogs", [filter(0, head)], { timeoutMs: 30000 });
  } catch {
    // Nodes with a block-range cap reject the full scan; fall back to fixed-size windows.
  }
  const ranges = [];
  for (let from = 0; from <= head; from += CHUNK) ranges.push([from, Math.min(head, from + CHUNK - 1)]);
  const logs = [];
  for (let i = 0; i < ranges.length; i += BATCH) {
    const group = ranges.slice(i, i + BATCH);
    const results = await rpcBatch(group.map(([from, to]) => ["eth_getLogs", [filter(from, to)]]), { timeoutMs: 30000 });
    results.forEach((result, j) => {
      if (result == null) throw new Error(`eth_getLogs failed for blocks ${group[j][0]}–${group[j][1]}.`);
      logs.push(...result);
    });
  }
  return logs;
}

function decode(functionName, data) {
  if (!data || data === "0x") return null;
  try {
    return decodeFunctionResult({ abi: ABI, functionName, data });
  } catch {
    return null;
  }
}

/** Active ERC-20 allowances and ERC-721 approvals granted by `owner`, newest first. */
export async function findApprovals(ownerInput) {
  const owner = ownerInput.toLowerCase();
  const ownerTopic = `0x${owner.slice(2).padStart(64, "0")}`;
  const head = Number(BigInt(await rpc("eth_blockNumber")));
  const logs = await fetchLogs(ownerTopic, head);

  logs.sort((a, b) => Number(BigInt(a.blockNumber) - BigInt(b.blockNumber)) || Number(BigInt(a.logIndex) - BigInt(b.logIndex)));
  const latest = new Map();
  for (const log of logs) {
    const token = log.address.toLowerCase();
    const base = { token, txHash: log.transactionHash, blockNumber: Number(BigInt(log.blockNumber)) };
    if (log.topics[0] === APPROVAL_FOR_ALL_TOPIC && log.topics.length === 3) {
      const spender = topicAddress(log.topics[2]);
      latest.set(`${token}|all|${spender}`, { ...base, kind: "all", spender, approved: BigInt(log.data || "0x0") !== 0n });
    } else if (log.topics[0] === APPROVAL_TOPIC && log.topics.length === 4) {
      const tokenId = BigInt(log.topics[3]);
      latest.set(`${token}|nft|${tokenId}`, { ...base, kind: "nft", spender: topicAddress(log.topics[2]), tokenId: tokenId.toString() });
    } else if (log.topics[0] === APPROVAL_TOPIC && log.topics.length === 3) {
      const spender = topicAddress(log.topics[2]);
      latest.set(`${token}|erc20|${spender}`, { ...base, kind: "erc20", spender, allowance: BigInt(log.data && log.data !== "0x" ? log.data : "0x0") });
    }
  }

  const entries = [...latest.values()];
  const calls = entries.map((entry) => {
    const data =
      entry.kind === "erc20"
        ? encodeFunctionData({ abi: ABI, functionName: "allowance", args: [owner, entry.spender] })
        : entry.kind === "nft"
          ? encodeFunctionData({ abi: ABI, functionName: "getApproved", args: [BigInt(entry.tokenId)] })
          : encodeFunctionData({ abi: ABI, functionName: "isApprovedForAll", args: [owner, entry.spender] });
    return ["eth_call", [{ to: entry.token, data }, "latest"]];
  });
  const results = [];
  for (let i = 0; i < calls.length; i += 100) results.push(...(await rpcBatch(calls.slice(i, i + 100))));

  const tokenInfo = db().prepare("SELECT name, symbol, decimals, token_type FROM tokens WHERE address = ?");
  const blockTime = db().prepare("SELECT timestamp FROM blocks WHERE number = ?");

  const active = [];
  entries.forEach((entry, i) => {
    let isActive;
    if (entry.kind === "erc20") {
      const current = decode("allowance", results[i]);
      if (current != null) entry.allowance = current;
      isActive = entry.allowance > 0n;
    } else if (entry.kind === "nft") {
      const current = decode("getApproved", results[i]);
      isActive = current != null ? current.toLowerCase() === entry.spender : entry.spender !== `0x${"0".repeat(40)}`;
    } else {
      const current = decode("isApprovedForAll", results[i]);
      isActive = current != null ? current : entry.approved;
    }
    if (!isActive) return;
    const info = tokenInfo.get(entry.token);
    active.push({
      kind: entry.kind,
      token: entry.token,
      tokenName: info?.name || null,
      tokenSymbol: info?.symbol || null,
      tokenDecimals: info?.decimals ?? null,
      spender: entry.spender,
      tokenId: entry.tokenId ?? null,
      allowance: entry.kind === "erc20" ? entry.allowance.toString() : null,
      unlimited: entry.kind === "erc20" ? entry.allowance >= UNLIMITED_THRESHOLD : entry.kind === "all",
      txHash: entry.txHash,
      blockNumber: entry.blockNumber,
      timestamp: blockTime.get(entry.blockNumber)?.timestamp ?? null,
    });
  });
  active.sort((a, b) => b.blockNumber - a.blockNumber);

  return { owner, head, scannedLogs: logs.length, revoked: entries.length - active.length, approvals: active };
}
