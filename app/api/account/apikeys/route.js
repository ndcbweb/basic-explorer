import { NextResponse } from "next/server";
import { createApiKey, deleteApiKey, listApiKeys, readJson, withUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withUser(async (_request, user) => NextResponse.json({ items: listApiKeys(user.id) }));

export const POST = withUser(async (request, user) => {
  const body = await readJson(request);
  return NextResponse.json({ item: createApiKey(user.id, body) }, { status: 201 });
});

export const DELETE = withUser(async (request, user) => {
  const key = request.nextUrl.searchParams.get("key") || (await readJson(request)).key;
  deleteApiKey(user.id, key);
  return NextResponse.json({ ok: true });
});
