import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

// Loaded at runtime so the bundler never tries to resolve the builtin.
const { DatabaseSync } = process.getBuiltinModule("node:sqlite");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE IF NOT EXISTS blocks (
  number INTEGER PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  parent_hash TEXT,
  timestamp INTEGER NOT NULL,
  signer TEXT,
  gas_used TEXT,
  gas_limit TEXT,
  base_fee TEXT,
  tx_count INTEGER NOT NULL DEFAULT 0,
  size INTEGER
);
CREATE INDEX IF NOT EXISTS blocks_signer ON blocks (signer, number);

CREATE TABLE IF NOT EXISTS txs (
  hash TEXT PRIMARY KEY,
  block_number INTEGER NOT NULL,
  tx_index INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  from_addr TEXT NOT NULL,
  to_addr TEXT,
  contract_address TEXT,
  value TEXT NOT NULL,
  gas_price TEXT,
  gas_used TEXT,
  fee TEXT,
  status INTEGER,
  method TEXT
);
CREATE INDEX IF NOT EXISTS txs_order ON txs (block_number DESC, tx_index DESC);
CREATE INDEX IF NOT EXISTS txs_from ON txs (from_addr, block_number DESC);
CREATE INDEX IF NOT EXISTS txs_to ON txs (to_addr, block_number DESC);
CREATE INDEX IF NOT EXISTS txs_created ON txs (contract_address);
CREATE INDEX IF NOT EXISTS txs_time ON txs (timestamp);

CREATE TABLE IF NOT EXISTS token_transfers (
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  from_addr TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (tx_hash, log_index)
);
CREATE INDEX IF NOT EXISTS tt_token ON token_transfers (token, block_number DESC);
CREATE INDEX IF NOT EXISTS tt_from ON token_transfers (from_addr, block_number DESC);
CREATE INDEX IF NOT EXISTS tt_to ON token_transfers (to_addr, block_number DESC);

CREATE TABLE IF NOT EXISTS tokens (
  address TEXT PRIMARY KEY,
  token_type TEXT NOT NULL,
  name TEXT,
  symbol TEXT,
  decimals INTEGER
);
`;

export function db() {
  if (!globalThis.__explorerDb) {
    fs.mkdirSync(config.dataDir, { recursive: true });
    const handle = new DatabaseSync(path.join(config.dataDir, "explorer.db"));
    handle.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 5000;");
    handle.exec(SCHEMA);
    globalThis.__explorerDb = handle;
  }
  return globalThis.__explorerDb;
}

export function getMeta(key) {
  const row = db().prepare("SELECT value FROM meta WHERE key = ?").get(key);
  return row ? row.value : null;
}

export function setMeta(key, value) {
  db().prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, String(value));
}

export function transaction(fn) {
  const handle = db();
  handle.exec("BEGIN");
  try {
    const result = fn(handle);
    handle.exec("COMMIT");
    return result;
  } catch (error) {
    handle.exec("ROLLBACK");
    throw error;
  }
}
