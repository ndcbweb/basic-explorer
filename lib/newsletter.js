import { db } from "./db";

let ready = false;

function ensure() {
  if (ready) return;
  db().exec("CREATE TABLE IF NOT EXISTS newsletter (email TEXT PRIMARY KEY COLLATE NOCASE, created_at INTEGER NOT NULL)");
  ready = true;
}

export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

export function subscribe(email) {
  ensure();
  const result = db()
    .prepare("INSERT OR IGNORE INTO newsletter (email, created_at) VALUES (?, ?)")
    .run(email.trim(), Math.floor(Date.now() / 1000));
  return result.changes > 0;
}

export function subscriberCount() {
  ensure();
  return db().prepare("SELECT COUNT(*) AS n FROM newsletter").get().n;
}
