import { NextResponse } from "next/server";
import { clearSessionCookie, deleteSession, errorResponse, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    deleteSession(await sessionToken());
    const response = NextResponse.json({ ok: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
