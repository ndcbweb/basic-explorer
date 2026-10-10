import { decodeFunctionResult, erc20Abi, hexToString } from "viem";
import { blockSigner } from "./clique";
import { db, getMeta, setMeta, transaction } from "./db";
import { methodLabel } from "./format";
import { rpc, rpcBatch, toHex } from "./rpc";

const BATCH_SIZE = 25;
const REORG_DEPTH = 12;
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const lower = (value) => (value ? value.toLowerCase() : null);
const topicAddress = (topic) => `0x${topic.slice(26)}`.toLowerCase();

export function indexerStatus() {
  const last = getMeta("last_block");
  const head = getMeta("chain_head");
  return { indexed: last == null ? -1 : Number(last), head: head == null ? null : Number(head) };
}

export function startIndexer() {
  if (globalThis.__explorerIndexer) return;
  globalThis.__explorerIndexer = true;
  const loop = async () => {
    let delay = 2000;
    try {
      if (await tick()) delay = 50;
    } catch (error) {
      console.error(`[indexer] ${error.message}`);
      delay = 5000;
    }
    setTimeout(loop, delay);
  };
  loop();
}

function rollbackTo(blockNumber) {
  transaction((handle) => {
    handle.prepare("DELETE FROM blocks WHERE number > ?").run(blockNumber);
    handle.prepare("DELETE FROM txs WHERE block_number > ?").run(blockNumber);
    handle.prepare("DELETE FROM token_transfers WHERE block_number > ?").run(blockNumber);
  });
  setMeta("last_block", blockNumber);
}

async function detectReorg(last) {
  if (last < 0) return false;
  const stored = db().prepare("SELECT hash FROM blocks WHERE number = ?").get(last);
  const live = await rpc("eth_getBlockByNumber", [toHex(last), false]);
  if (stored && live && stored.hash === live.hash) return false;
  rollbackTo(Math.max(-1, last - REORG_DEPTH));
  return true;
}

async function loadReceipts(blocks) {
  const withTxs = blocks.filter((block) => block.transactions.length);
  const perBlock = await rpcBatch(withTxs.map((block) => ["eth_getBlockReceipts", [block.hash]]));
  const receipts = new Map();
  const missing = [];
  withTxs.forEach((block, i) => {
    if (perBlock[i]) perBlock[i].forEach((receipt) => receipts.set(receipt.transactionHash, receipt));
    else missing.push(...block.transactions.map((tx) => tx.hash));
  });
  if (missing.length) {
    const fallback = await rpcBatch(missing.map((hash) => ["eth_getTransactionReceipt", [hash]]));
    fallback.forEach((receipt) => receipt && receipts.set(receipt.transactionHash, receipt));
  }
  return receipts;
}

function decodeTokenString(hex, functionName) {
  if (!hex || hex === "0x") return null;
  try {
    return decodeFunctionResult({ abi: erc20Abi, functionName, data: hex });
  } catch {
    try {
      return hexToString(hex, { size: 32 }).replace(/\0/g, "") || null;
    } catch {
      return null;
    }
  }
}

async function registerTokens(tokens) {
  const known = db().prepare("SELECT 1 FROM tokens WHERE address = ?");
  const fresh = [...tokens.entries()].filter(([address]) => !known.get(address));
  if (!fresh.length) return;
  const calls = fresh.flatMap(([address]) => [
    ["eth_call", [{ to: address, data: "0x06fdde03" }, "latest"]],
    ["eth_call", [{ to: address, data: "0x95d89b41" }, "latest"]],
    ["eth_call", [{ to: address, data: "0x313ce567" }, "latest"]],
  ]);
  const results = await rpcBatch(calls);
  const insert = db().prepare(
    "INSERT OR IGNORE INTO tokens (address, token_type, name, symbol, decimals) VALUES (?, ?, ?, ?, ?)"
  );
  fresh.forEach(([address, tokenType], i) => {
    const [name, symbol, decimals] = results.slice(i * 3, i * 3 + 3);
    let decimalsValue = null;
    if (tokenType === "ERC-20") {
      try {
        decimalsValue = decimals && decimals !== "0x" ? Number(BigInt(decimals)) : 18;
      } catch {
        decimalsValue = 18;
      }
    }
    insert.run(address, tokenType, decodeTokenString(name, "name"), decodeTokenString(symbol, "symbol"), decimalsValue);
  });
}

async function tick() {
  const head = Number(BigInt(await rpc("eth_blockNumber")));
  setMeta("chain_head", head);
  const lastMeta = getMeta("last_block");
  const last = lastMeta == null ? -1 : Number(lastMeta);
  if (last > head) {
    rollbackTo(head);
    return true;
  }
  if (await detectReorg(last)) return true;
  if (last >= head) return false;

  const from = last + 1;
  const to = Math.min(head, last + BATCH_SIZE);
  const numbers = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const blocks = await rpcBatch(numbers.map((n) => ["eth_getBlockByNumber", [toHex(n), true]]));
  if (blocks.some((block) => !block)) throw new Error(`missing block in range ${from}-${to}`);

  const receipts = await loadReceipts(blocks);
  const signers = await Promise.all(blocks.map((block) => blockSigner(block)));
  const tokens = new Map();

  transaction((handle) => {
    const insertBlock = handle.prepare(
      `INSERT OR REPLACE INTO blocks (number, hash, parent_hash, timestamp, signer, gas_used, gas_limit, base_fee, tx_count, size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertTx = handle.prepare(
      `INSERT OR REPLACE INTO txs (hash, block_number, tx_index, timestamp, from_addr, to_addr, contract_address, value, gas_price, gas_used, fee, status, method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertTransfer = handle.prepare(
      `INSERT OR REPLACE INTO token_transfers (tx_hash, log_index, block_number, timestamp, token, token_type, from_addr, to_addr, value)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    blocks.forEach((block, i) => {
      const number = Number(BigInt(block.number));
      const timestamp = Number(BigInt(block.timestamp));
      insertBlock.run(
        number,
        block.hash,
        block.parentHash,
        timestamp,
        signers[i],
        BigInt(block.gasUsed).toString(),
        BigInt(block.gasLimit).toString(),
        block.baseFeePerGas ? BigInt(block.baseFeePerGas).toString() : null,
        block.transactions.length,
        block.size ? Number(BigInt(block.size)) : null
      );

      for (const tx of block.transactions) {
        const receipt = receipts.get(tx.hash);
        const gasUsed = receipt ? BigInt(receipt.gasUsed) : null;
        const price = BigInt(receipt?.effectiveGasPrice || tx.gasPrice || "0x0");
        insertTx.run(
          tx.hash,
          number,
          Number(BigInt(tx.transactionIndex)),
          timestamp,
          lower(tx.from),
          lower(tx.to),
          lower(receipt?.contractAddress),
          BigInt(tx.value).toString(),
          price.toString(),
          gasUsed == null ? null : gasUsed.toString(),
          gasUsed == null ? null : (gasUsed * price).toString(),
          receipt ? Number(BigInt(receipt.status ?? "0x1")) : null,
          methodLabel(tx.input, tx.to)
        );

        for (const log of receipt?.logs || []) {
          if (log.topics?.[0] !== TRANSFER_TOPIC) continue;
          let tokenType = null;
          let value = null;
          if (log.topics.length === 3 && log.data && log.data.length === 66) {
            tokenType = "ERC-20";
            value = BigInt(log.data).toString();
          } else if (log.topics.length === 4) {
            tokenType = "ERC-721";
            value = BigInt(log.topics[3]).toString();
          }
          if (!tokenType) continue;
          const token = log.address.toLowerCase();
          tokens.set(token, tokenType);
          insertTransfer.run(
            tx.hash,
            Number(BigInt(log.logIndex)),
            number,
            timestamp,
            token,
            tokenType,
            topicAddress(log.topics[1]),
            topicAddress(log.topics[2]),
            value
          );
        }
      }
    });
  });

  setMeta("last_block", to);
  if (tokens.size) await registerTokens(tokens);
  return to < head;
}
