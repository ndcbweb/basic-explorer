import crypto from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "./db";
import { isAddress } from "./format";

const scrypt = promisify(crypto.scrypt);

export const SESSION_COOKIE = "bx_session";
const REMEMBER_SECONDS = 30 * 24 * 3600;
const SESSION_SECONDS = 24 * 3600;
const THROTTLE_MAX = 10;
const THROTTLE_WINDOW_MS = 15 * 60 * 1000;

export const LIMITS = { watchlist: 50, tags: 200, apiKeys: 3 };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions (user_id);
CREATE TABLE IF NOT EXISTS watchlist (
  user_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, address)
);
CREATE TABLE IF NOT EXISTS name_tags (
  user_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  tag TEXT NOT NULL,
  note TEXT,
  PRIMARY KEY (user_id, address)
);
CREATE TABLE IF NOT EXISTS api_keys (
  key TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS api_keys_user ON api_keys (user_id);
`;

function authDb() {
  const handle = db();
  if (!globalThis.__explorerAuthReady) {
    handle.exec(SCHEMA);
    globalThis.__explorerAuthReady = true;
  }
  return handle;
}

const now = () => Math.floor(Date.now() / 1000);

// node:sqlite rows have a null prototype, which React cannot pass to client components.
const plain = (rows) => rows.map((row) => ({ ...row }));

export class AuthError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/* ---------- validation ---------- */

export function validateUsername(username) {
  if (typeof username !== "string" || !/^[A-Za-z0-9_]{3,30}$/.test(username)) {
    throw new AuthError("Username must be 3-30 characters: letters, numbers and underscores only.");
  }
  return username;
}

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) throw new AuthError("Password must be at least 8 characters.");
  if (password.length > 200) throw new AuthError("Password is too long.");
  return password;
}

export function validateEmail(email) {
  if (email == null || email === "") return null;
  const value = String(email).trim();
  if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new AuthError("Enter a valid email address.");
  return value;
}

function validateAddress(address) {
  const value = String(address || "").trim();
  if (!isAddress(value)) throw new AuthError("Enter a valid 0x address (40 hex characters).");
  return value.toLowerCase();
}

function cleanText(value, max, label) {
  const text = String(value ?? "").trim();
  if (text.length > max) throw new AuthError(`${label} must be ${max} characters or fewer.`);
  return text;
}

/** Only same-site relative paths are allowed as post-login destinations. */
export function safeNext(next, fallback = "/myaccount") {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/* ---------- passwords ---------- */

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = String(stored || "").split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

// Used to spend comparable time when the username does not exist.
const DUMMY_HASH = `${"00".repeat(16)}:${"00".repeat(64)}`;

/* ---------- brute force throttle ---------- */

const attempts = (globalThis.__explorerAuthAttempts ??= new Map());

function throttleKey(username, ip) {
  return `${String(username || "").toLowerCase()}|${ip}`;
}

function isThrottled(key) {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > THROTTLE_WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= THROTTLE_MAX;
}

function recordFailure(key) {
  const entry = attempts.get(key);
  if (!entry || Date.now() - entry.first > THROTTLE_WINDOW_MS) attempts.set(key, { count: 1, first: Date.now() });
  else entry.count += 1;
  if (attempts.size > 10000) {
    for (const [k, v] of attempts) if (Date.now() - v.first > THROTTLE_WINDOW_MS) attempts.delete(k);
  }
}

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

/* ---------- users & sessions ---------- */

export async function registerUser({ username, email, password }) {
  validateUsername(username);
  const cleanEmail = validateEmail(email);
  validatePassword(password);
  const handle = authDb();
  if (handle.prepare("SELECT 1 FROM users WHERE username = ?").get(username)) {
    throw new AuthError("That username is already taken.", 409);
  }
  const passwordHash = await hashPassword(password);
  try {
    const result = handle
      .prepare("INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, ?)")
      .run(username, cleanEmail, passwordHash, now());
    return { id: Number(result.lastInsertRowid), username };
  } catch (error) {
    if (/UNIQUE/i.test(error.message)) throw new AuthError("That username is already taken.", 409);
    throw error;
  }
}

export async function loginUser({ username, password }, ip) {
  const key = throttleKey(username, ip);
  if (isThrottled(key)) throw new AuthError("Too many failed attempts. Try again in 15 minutes.", 429);
  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    throw new AuthError("Enter your username and password.");
  }
  const user = authDb().prepare("SELECT id, username, password_hash FROM users WHERE username = ?").get(username);
  const ok = await verifyPassword(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) {
    recordFailure(key);
    throw new AuthError("Invalid username or password.", 401);
  }
  attempts.delete(key);
  return { id: user.id, username: user.username };
}

export function createSession(userId, remember) {
  const token = crypto.randomBytes(32).toString("hex");
  const ttl = remember ? REMEMBER_SECONDS : SESSION_SECONDS;
  const handle = authDb();
  handle.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now());
  handle.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, now() + ttl);
  return { token, maxAge: remember ? REMEMBER_SECONDS : undefined };
}

export function setSessionCookie(response, { token, maxAge }) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE === "1",
    ...(maxAge ? { maxAge } : {}),
  });
}

export function clearSessionCookie(response) {
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export function deleteSession(token) {
  if (token) authDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

function userForToken(token) {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const row = authDb()
    .prepare(
      `SELECT u.id, u.username, u.email, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`
    )
    .get(token, now());
  return row ? { id: row.id, username: row.username, email: row.email, createdAt: row.created_at } : null;
}

/** The signed-in user for the current request, or null. */
export async function currentUser() {
  const store = await cookies();
  return userForToken(store.get(SESSION_COOKIE)?.value);
}

export async function sessionToken() {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value || null;
}

/* ---------- route helpers ---------- */

export async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

export function errorResponse(error) {
  if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("[auth]", error);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/** Wraps an account route handler: rejects anonymous requests and maps AuthErrors to JSON. */
export function withUser(handler) {
  return async (request) => {
    try {
      const user = await currentUser();
      if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
      return await handler(request, user);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/* ---------- watch list ---------- */

export function listWatchlist(userId) {
  return plain(
    authDb()
      .prepare("SELECT address, note, created_at AS createdAt FROM watchlist WHERE user_id = ? ORDER BY created_at DESC, address")
      .all(userId)
  );
}

export function addWatchlist(userId, { address, note }) {
  const addr = validateAddress(address);
  const text = cleanText(note, 200, "Note");
  const handle = authDb();
  const exists = handle.prepare("SELECT 1 FROM watchlist WHERE user_id = ? AND address = ?").get(userId, addr);
  if (!exists) {
    const { n } = handle.prepare("SELECT COUNT(*) AS n FROM watchlist WHERE user_id = ?").get(userId);
    if (n >= LIMITS.watchlist) throw new AuthError(`Watch list is limited to ${LIMITS.watchlist} addresses.`);
  }
  handle
    .prepare(
      `INSERT INTO watchlist (user_id, address, note, created_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, address) DO UPDATE SET note = excluded.note`
    )
    .run(userId, addr, text, now());
  return { address: addr, note: text };
}

export function removeWatchlist(userId, address) {
  authDb().prepare("DELETE FROM watchlist WHERE user_id = ? AND address = ?").run(userId, validateAddress(address));
}

/* ---------- private name tags ---------- */

export function listTags(userId) {
  return plain(authDb().prepare("SELECT address, tag, note FROM name_tags WHERE user_id = ? ORDER BY tag COLLATE NOCASE").all(userId));
}

export function addTag(userId, { address, tag, note }) {
  const addr = validateAddress(address);
  const label = cleanText(tag, 35, "Tag");
  if (!label) throw new AuthError("Enter a name tag.");
  const text = cleanText(note, 200, "Note");
  const handle = authDb();
  const exists = handle.prepare("SELECT 1 FROM name_tags WHERE user_id = ? AND address = ?").get(userId, addr);
  if (!exists) {
    const { n } = handle.prepare("SELECT COUNT(*) AS n FROM name_tags WHERE user_id = ?").get(userId);
    if (n >= LIMITS.tags) throw new AuthError(`Private name tags are limited to ${LIMITS.tags}.`);
  }
  handle
    .prepare(
      `INSERT INTO name_tags (user_id, address, tag, note) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, address) DO UPDATE SET tag = excluded.tag, note = excluded.note`
    )
    .run(userId, addr, label, text);
  return { address: addr, tag: label, note: text };
}

export function removeTag(userId, address) {
  authDb().prepare("DELETE FROM name_tags WHERE user_id = ? AND address = ?").run(userId, validateAddress(address));
}

/* ---------- API keys ---------- */

export function listApiKeys(userId) {
  return plain(
    authDb().prepare("SELECT key, name, created_at AS createdAt FROM api_keys WHERE user_id = ? ORDER BY created_at, key").all(userId)
  );
}

export function createApiKey(userId, { name }) {
  const label = cleanText(name, 50, "Name") || "Default";
  const handle = authDb();
  const { n } = handle.prepare("SELECT COUNT(*) AS n FROM api_keys WHERE user_id = ?").get(userId);
  if (n >= LIMITS.apiKeys) throw new AuthError(`You can have at most ${LIMITS.apiKeys} API keys.`);
  const key = crypto.randomBytes(16).toString("hex");
  const createdAt = now();
  handle.prepare("INSERT INTO api_keys (key, user_id, name, created_at) VALUES (?, ?, ?, ?)").run(key, userId, label, createdAt);
  return { key, name: label, createdAt };
}

export function deleteApiKey(userId, key) {
  if (typeof key !== "string" || !/^[0-9a-f]{32}$/.test(key)) throw new AuthError("Invalid API key.");
  authDb().prepare("DELETE FROM api_keys WHERE user_id = ? AND key = ?").run(userId, key);
}
