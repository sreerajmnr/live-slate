// Simple signed-cookie session. Credentials can be overridden with env vars on Vercel.
export const SESSION_COOKIE = "ls_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

// On Vercel, APP_USERNAME and APP_PASSWORD must be set in the project's
// Environment Variables. The test/test defaults only apply when running locally.
const onVercel = Boolean(process.env.VERCEL);

export function getCredentials() {
  const username = process.env.APP_USERNAME || (onVercel ? "" : "test");
  const password = process.env.APP_PASSWORD || (onVercel ? "" : "test");
  if (!username || !password) return null; // login not configured
  return { username, password };
}

function getSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  // Fallback: derive from the configured credentials so it's never a public value on Vercel.
  const c = getCredentials();
  return `live-slate:${c?.username}:${c?.password}:local`;
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
