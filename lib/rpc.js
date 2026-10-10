import { config } from "./config";

let nextId = 1;

async function post(body, timeoutMs) {
  const res = await fetch(config.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  return res.json();
}

export async function rpc(method, params = [], { timeoutMs = 10000 } = {}) {
  const json = await post({ jsonrpc: "2.0", id: nextId++, method, params }, timeoutMs);
  if (json.error) throw new Error(json.error.message || `RPC error in ${method}`);
  return json.result;
}

/** Runs calls as one JSON-RPC batch; failed entries resolve to null. */
export async function rpcBatch(calls, { timeoutMs = 20000 } = {}) {
  if (!calls.length) return [];
  const base = nextId;
  nextId += calls.length;
  const body = calls.map(([method, params], i) => ({ jsonrpc: "2.0", id: base + i, method, params: params || [] }));
  const json = await post(body, timeoutMs);
  const byId = new Map((Array.isArray(json) ? json : [json]).map((item) => [item.id, item]));
  return body.map((req) => {
    const item = byId.get(req.id);
    return item && !item.error ? item.result : null;
  });
}

export async function safeRpc(method, params = [], fallback = null) {
  try {
    return await rpc(method, params);
  } catch {
    return fallback;
  }
}

export const toHex = (n) => `0x${BigInt(n).toString(16)}`;
