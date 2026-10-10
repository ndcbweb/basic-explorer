import { NextResponse } from "next/server";
import { indexerStatus } from "@/lib/indexer";
import { safeRpc } from "@/lib/rpc";

export const dynamic = "force-dynamic";

export async function GET() {
  const head = await safeRpc("eth_blockNumber");
  const status = indexerStatus();
  const ok = head != null;
  return NextResponse.json(
    { ok, chainHead: head != null ? Number(BigInt(head)) : null, indexed: status.indexed },
    { status: ok ? 200 : 503 }
  );
}
