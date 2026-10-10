import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser().catch(() => null);
  return NextResponse.json(
    { user: user ? { username: user.username } : null },
    { headers: { "cache-control": "no-store" } }
  );
}
