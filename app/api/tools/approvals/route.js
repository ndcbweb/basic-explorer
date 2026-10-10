import { isAddress } from "@/lib/format";
import { findApprovals } from "@/lib/token-approvals";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const address = (request.nextUrl.searchParams.get("address") || "").trim();
  if (!isAddress(address)) return Response.json({ error: "Enter a valid 0x address." }, { status: 400 });
  try {
    return Response.json(await findApprovals(address));
  } catch (error) {
    return Response.json({ error: `Could not load approvals: ${error.message}` }, { status: 502 });
  }
}
