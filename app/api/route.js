import { NextResponse } from "next/server";
import { handleApi } from "@/lib/etherscan-api";

export const dynamic = "force-dynamic";

const CORS = { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type" };

async function respond(params) {
  return NextResponse.json(await handleApi(params), { headers: CORS });
}

export async function GET(request) {
  return respond(Object.fromEntries(request.nextUrl.searchParams));
}

export async function POST(request) {
  const query = Object.fromEntries(request.nextUrl.searchParams);
  const type = request.headers.get("content-type") || "";
  let body = {};
  try {
    if (type.includes("application/json")) body = await request.json();
    else body = Object.fromEntries(await request.formData());
  } catch {
    body = {};
  }
  return respond({ ...query, ...body });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...CORS, "access-control-allow-methods": "GET, POST, OPTIONS" } });
}
