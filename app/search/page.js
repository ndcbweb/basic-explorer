import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isAddress, isHash } from "@/lib/format";
import { safeRpc } from "@/lib/rpc";

async function resolve(q) {
  const digits = q.replace(/,/g, "");
  if (/^\d+$/.test(digits)) return `/block/${digits}`;
  if (isAddress(q)) return `/address/${q.toLowerCase()}`;
  if (isHash(q)) {
    const hash = q.toLowerCase();
    if (db().prepare("SELECT 1 FROM txs WHERE hash = ?").get(hash)) return `/tx/${hash}`;
    if (await safeRpc("eth_getTransactionByHash", [hash])) return `/tx/${hash}`;
    if (await safeRpc("eth_getBlockByHash", [hash, false])) return `/block/${hash}`;
    return `/tx/${hash}`;
  }
  if (!q) return null;
  const token = db()
    .prepare("SELECT address FROM tokens WHERE lower(symbol) = lower(?) OR lower(name) = lower(?) LIMIT 1")
    .get(q, q);
  return token ? `/token/${token.address}` : null;
}

export default async function SearchPage({ searchParams }) {
  const { q = "" } = (await searchParams) || {};
  const target = await resolve(String(q).trim());
  if (!target) notFound();
  redirect(target);
}
