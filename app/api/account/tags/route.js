import { NextResponse } from "next/server";
import { addTag, listTags, readJson, removeTag, withUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withUser(async (_request, user) => NextResponse.json({ items: listTags(user.id) }));

export const POST = withUser(async (request, user) => {
  const body = await readJson(request);
  return NextResponse.json({ item: addTag(user.id, body) }, { status: 201 });
});

export const DELETE = withUser(async (request, user) => {
  const address = request.nextUrl.searchParams.get("address") || (await readJson(request)).address;
  removeTag(user.id, address);
  return NextResponse.json({ ok: true });
});
