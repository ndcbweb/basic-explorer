import { isHash } from "@/lib/format";
import { rpc } from "@/lib/rpc";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const hash = (request.nextUrl.searchParams.get("hash") || "").trim();
  if (!isHash(hash)) return Response.json({ error: "Enter a valid 66-character transaction hash." }, { status: 400 });
  try {
    const tx = await rpc("eth_getTransactionByHash", [hash]);
    if (!tx) return Response.json({ error: "Transaction not found." }, { status: 404 });
    return Response.json({
      hash: tx.hash,
      from: tx.from?.toLowerCase() || null,
      to: tx.to?.toLowerCase() || null,
      blockNumber: tx.blockNumber ? Number(BigInt(tx.blockNumber)) : null,
      input: tx.input || "0x",
    });
  } catch (error) {
    return Response.json({ error: `Node request failed: ${error.message}` }, { status: 502 });
  }
}
