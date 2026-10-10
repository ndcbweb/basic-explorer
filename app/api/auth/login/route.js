import { NextResponse } from "next/server";
import { clientIp, createSession, errorResponse, loginUser, readJson, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await readJson(request);
    const user = await loginUser({ username: body.username, password: body.password }, await clientIp());
    const response = NextResponse.json({ user: { username: user.username } });
    setSessionCookie(response, createSession(user.id, Boolean(body.remember)));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
