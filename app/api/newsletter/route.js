import { NextResponse } from "next/server";
import { EMAIL_RE, subscribe } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let email = "";
  try {
    ({ email = "" } = await request.json());
  } catch {
    email = "";
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }
  const added = subscribe(email);
  return NextResponse.json({ ok: true, message: added ? "You're subscribed." : "You're already on the list." });
}
