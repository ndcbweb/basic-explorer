import { NextResponse } from "next/server";
import { createSession, errorResponse, readJson, registerUser, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await readJson(request);
    const user = await registerUser({ username: body.username, email: body.email, password: body.password });
    const response = NextResponse.json({ user: { username: user.username } }, { status: 201 });
    setSessionCookie(response, createSession(user.id, false));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
