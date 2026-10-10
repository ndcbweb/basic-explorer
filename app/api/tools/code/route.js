import { isAddress } from "@/lib/format";
import { rpc } from "@/lib/rpc";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const address = (request.nextUrl.searchParams.get("address") || "").trim().toLowerCase();
  if (!isAddress(address)) return Response.json({ error: "Enter a valid 0x address." }, { status: 400 });
  try {
    const code = await rpc("eth_getCode", [address, "latest"]);
    return Response.json({ address, code: code || "0x", size: code ? (code.length - 2) / 2 : 0 });
  } catch (error) {
    return Response.json({ error: `Node request failed: ${error.message}` }, { status: 502 });
  }
}
