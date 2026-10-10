import { keccak256 } from "viem";
import { db } from "./db";
import { rpcBatch, safeRpc } from "./rpc";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS verified_contracts (
  address TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  compiler_version TEXT NOT NULL,
  compiler_type TEXT,
  optimization INTEGER NOT NULL DEFAULT 0,
  runs INTEGER,
  evm_version TEXT,
  license TEXT,
  source TEXT NOT NULL,
  abi TEXT,
  constructor_args TEXT,
  runtime_hash TEXT,
  match_type TEXT,
  verified_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS vc_time ON verified_contracts (verified_at DESC);
CREATE INDEX IF NOT EXISTS vc_hash ON verified_contracts (runtime_hash);

CREATE TABLE IF NOT EXISTS contract_code_hashes (
  address TEXT PRIMARY KEY,
  hash TEXT,
  size INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS cch_hash ON contract_code_hashes (hash);
`;

function handle() {
  const conn = db();
  if (!globalThis.__contractsSchema) {
    conn.exec(SCHEMA);
    globalThis.__contractsSchema = true;
  }
  return conn;
}

const strip0x = (hex) => (hex || "").replace(/^0x/i, "").toLowerCase();

/** Removes the trailing CBOR metadata blob (its length is encoded in the final 2 bytes). */
export function stripMetadata(hex) {
  const code = strip0x(hex);
  if (code.length < 4) return code;
  const cborLength = Number.parseInt(code.slice(-4), 16);
  const total = (cborLength + 2) * 2;
  if (!cborLength || total > code.length) return code;
  // Solidity metadata always starts with a CBOR map header (0xa1-0xa5).
  const head = Number.parseInt(code.slice(code.length - total, code.length - total + 2), 16);
  if (head < 0xa1 || head > 0xa5) return code;
  return code.slice(0, code.length - total);
}

/** keccak256 of runtime code without metadata, so recompiles of identical source hash the same. */
export function runtimeHash(code) {
  const stripped = stripMetadata(code);
  return stripped ? keccak256(`0x${stripped}`) : null;
}

/**
 * Compares on-chain runtime code with compiler output. Immutable slots and unlinked
 * library placeholders are masked in both before comparing.
 * Returns "exact", "partial" (metadata differs) or null.
 */
export function compareBytecode(onchainHex, compiledHex, immutableReferences = {}) {
  let onchain = strip0x(onchainHex);
  let compiled = strip0x(compiledHex);
  if (!onchain || !compiled || onchain.length !== compiled.length) {
    const a = stripMetadata(onchain);
    const b = stripMetadata(compiled);
    if (!a || a.length !== b.length) return null;
  }
  const mask = (text, start, length) => text.slice(0, start) + "0".repeat(length) + text.slice(start + length);
  for (const refs of Object.values(immutableReferences || {})) {
    for (const { start, length } of refs) {
      if (start * 2 + length * 2 > onchain.length) continue;
      onchain = mask(onchain, start * 2, length * 2);
      compiled = mask(compiled, start * 2, length * 2);
    }
  }
  for (const match of compiled.matchAll(/__\$[0-9a-f]{34}\$__/g)) {
    onchain = mask(onchain, match.index, 40);
    compiled = mask(compiled, match.index, 40);
  }
  if (onchain === compiled) return "exact";
  return stripMetadata(onchain) === stripMetadata(compiled) ? "partial" : null;
}

export function verifiedCount() {
  return handle().prepare("SELECT COUNT(*) AS n FROM verified_contracts").get().n;
}

export function listVerified({ limit = 25, offset = 0 } = {}) {
  return handle()
    .prepare(
      `SELECT address, name, compiler_version, compiler_type, optimization, runs, evm_version, license, match_type, verified_at
       FROM verified_contracts ORDER BY verified_at DESC LIMIT ? OFFSET ?`
    )
    .all(limit, offset);
}

export function getVerified(address) {
  if (!address) return null;
  return handle().prepare("SELECT * FROM verified_contracts WHERE address = ?").get(address.toLowerCase()) || null;
}

export function saveVerified(row) {
  handle()
    .prepare(
      `INSERT INTO verified_contracts
        (address, name, compiler_version, compiler_type, optimization, runs, evm_version, license, source, abi, constructor_args, runtime_hash, match_type, verified_at)
       VALUES ($address, $name, $compiler_version, $compiler_type, $optimization, $runs, $evm_version, $license, $source, $abi, $constructor_args, $runtime_hash, $match_type, $verified_at)`
    )
    .run({
      $address: row.address.toLowerCase(),
      $name: row.name,
      $compiler_version: row.compiler_version,
      $compiler_type: row.compiler_type || "single",
      $optimization: row.optimization ? 1 : 0,
      $runs: row.runs ?? null,
      $evm_version: row.evm_version || "default",
      $license: row.license || null,
      $source: row.source,
      $abi: row.abi || null,
      $constructor_args: row.constructor_args || null,
      $runtime_hash: row.runtime_hash || null,
      $match_type: row.match_type || null,
      $verified_at: Math.floor(Date.now() / 1000),
    });
}

/** Splits stored source into files: standard-JSON input yields one entry per source path. */
export function sourceFiles(row) {
  if (!row?.source) return [];
  if (row.compiler_type === "standard-json" || row.source.trimStart().startsWith("{")) {
    try {
      const input = JSON.parse(row.source);
      if (input?.sources) {
        return Object.entries(input.sources).map(([name, file]) => ({ name, content: file?.content ?? "" }));
      }
    } catch {
      // Plain Solidity that happens to start with "{" falls through.
    }
  }
  return [{ name: `${row.name}.sol`, content: row.source }];
}

/** Flattened source text, used by the diff checker. */
export function flatSource(row) {
  const files = sourceFiles(row);
  if (files.length === 1) return files[0].content;
  return files.map((file) => `// File: ${file.name}\n${file.content}`).join("\n\n");
}

function escapeLike(text) {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function snippetFor(row, term) {
  const needle = term.toLowerCase();
  for (const file of sourceFiles(row)) {
    const lines = file.content.split("\n");
    const index = lines.findIndex((line) => line.toLowerCase().includes(needle));
    if (index !== -1) {
      const from = Math.max(0, index - 1);
      return { file: file.name, line: index + 1, startLine: from + 1, lines: lines.slice(from, index + 2) };
    }
  }
  return null;
}

export function searchVerified(term, { limit = 25, offset = 0 } = {}) {
  const like = `%${escapeLike(term)}%`;
  const conn = handle();
  const where = "name LIKE $q ESCAPE '\\' OR source LIKE $q ESCAPE '\\' OR address = $exact";
  const params = { $q: like, $exact: term.toLowerCase() };
  const total = conn.prepare(`SELECT COUNT(*) AS n FROM verified_contracts WHERE ${where}`).get(params).n;
  const rows = conn
    .prepare(`SELECT * FROM verified_contracts WHERE ${where} ORDER BY verified_at DESC LIMIT $limit OFFSET $offset`)
    .all({ ...params, $limit: limit, $offset: offset });
  return { total, rows: rows.map((row) => ({ ...row, snippet: snippetFor(row, term) })) };
}

/** Every contract created by an indexed transaction, newest first. */
export function deployedContracts({ limit = 25, offset = 0 } = {}) {
  return handle()
    .prepare(
      `SELECT t.contract_address AS address, t.hash, t.block_number, t.timestamp, t.from_addr, v.name AS verified_name
       FROM txs t LEFT JOIN verified_contracts v ON v.address = t.contract_address
       WHERE t.contract_address IS NOT NULL ORDER BY t.block_number DESC, t.tx_index DESC LIMIT ? OFFSET ?`
    )
    .all(limit, offset);
}

export function deployedCount() {
  return handle().prepare("SELECT COUNT(*) AS n FROM txs WHERE contract_address IS NOT NULL").get().n;
}

const BATCH = 50;

/** Fills contract_code_hashes for every indexed contract that has not been hashed yet. */
export async function refreshCodeHashes() {
  const conn = handle();
  const missing = conn
    .prepare(
      `SELECT DISTINCT t.contract_address AS address FROM txs t
       LEFT JOIN contract_code_hashes h ON h.address = t.contract_address
       WHERE t.contract_address IS NOT NULL AND h.address IS NULL`
    )
    .all()
    .map((row) => row.address);
  const insert = conn.prepare("INSERT OR REPLACE INTO contract_code_hashes (address, hash, size) VALUES (?, ?, ?)");
  for (let i = 0; i < missing.length; i += BATCH) {
    const chunk = missing.slice(i, i + BATCH);
    const codes = await rpcBatch(chunk.map((address) => ["eth_getCode", [address, "latest"]]));
    chunk.forEach((address, j) => {
      const code = codes[j];
      if (code == null) return; // RPC failure: retry on the next request.
      const size = strip0x(code).length / 2;
      insert.run(address, size ? runtimeHash(code) : null, size);
    });
  }
  return missing.length;
}

/** Hash for a single address, computed live and cached. */
export async function codeHashFor(address) {
  const addr = address.toLowerCase();
  const code = await safeRpc("eth_getCode", [addr, "latest"], null);
  if (code == null) return { hash: null, size: 0, code: null };
  const size = strip0x(code).length / 2;
  const hash = size ? runtimeHash(code) : null;
  handle().prepare("INSERT OR REPLACE INTO contract_code_hashes (address, hash, size) VALUES (?, ?, ?)").run(addr, hash, size);
  return { hash, size, code };
}

export function contractsWithHash(hash, exclude) {
  return handle()
    .prepare(
      `SELECT h.address, h.size, v.name AS verified_name, v.compiler_version,
              (SELECT t.block_number FROM txs t WHERE t.contract_address = h.address LIMIT 1) AS block_number,
              (SELECT t.hash FROM txs t WHERE t.contract_address = h.address LIMIT 1) AS tx_hash
       FROM contract_code_hashes h LEFT JOIN verified_contracts v ON v.address = h.address
       WHERE h.hash = ? AND h.address != ? ORDER BY block_number DESC`
    )
    .all(hash, (exclude || "").toLowerCase());
}

export function creationTx(address) {
  return handle().prepare("SELECT hash FROM txs WHERE contract_address = ? LIMIT 1").get(address.toLowerCase()) || null;
}
