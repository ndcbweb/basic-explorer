import { NextResponse } from "next/server";
import { rpc } from "@/lib/rpc";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["eth_call", "eth_getCode", "eth_chainId", "eth_blockNumber", "eth_getBalance", "eth_estimateGas"]);

/** Browser-side contract reads go through the explorer so the chain RPC can stay private. */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const method = String(body.method || "");
    if (!ALLOWED.has(method)) {
      return NextResponse.json({ error: { message: `${method || "method"} is not allowed` } }, { status: 400 });
    }
    const params = Array.isArray(body.params) ? body.params : [];
    const result = await rpc(method, params);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: { message: String(error?.message || error).slice(0, 300) } }, { status: 502 });
  }
}
