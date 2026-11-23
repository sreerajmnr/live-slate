import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  cookieOptions,
  createSessionToken,
  getCredentials,
} from "../../../lib/auth";

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {}
  const { username = "", password = "" } = body;
  const creds = getCredentials();

  if (username.trim() !== creds.username || password !== creds.password) {
    return NextResponse.json(
      { ok: false, error: "Invalid username or password" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true, username: creds.username });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(creds.username), cookieOptions);
  return res;
}
