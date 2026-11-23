// Simple signed-cookie session. Credentials can be overridden with env vars on Vercel.
export const SESSION_COOKIE = "ls_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function getCredentials() {
  return {
    username: process.env.APP_USERNAME || "anvi",
    password: process.env.APP_PASSWORD || "anvith",
  };
}

function getSecret() {
  return process.env.SESSION_SECRET || "live-slate-dev-secret-change-me";
}

const enc = new TextEncoder();

async function hmac(data) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(sig).toString("base64url");
}

export async function createSessionToken(username) {
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + MAX_AGE_SECONDS * 1000 })
  ).toString("base64url");
  return `${payload}.${await hmac(payload)}`;
}

export async function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  if ((await hmac(payload)) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return { username: data.u };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
