import { NextResponse } from "next/server";
import { addWatchlist, listWatchlist, readJson, removeWatchlist, withUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withUser(async (_request, user) => NextResponse.json({ items: listWatchlist(user.id) }));

export const POST = withUser(async (request, user) => {
  const body = await readJson(request);
  return NextResponse.json({ item: addWatchlist(user.id, body) }, { status: 201 });
});

export const DELETE = withUser(async (request, user) => {
  const address = request.nextUrl.searchParams.get("address") || (await readJson(request)).address;
  removeWatchlist(user.id, address);
  return NextResponse.json({ ok: true });
});
