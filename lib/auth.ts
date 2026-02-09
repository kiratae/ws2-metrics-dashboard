export type SessionPayload = {
  u: string;      // username
  exp: number;    // unix seconds
};

const SECRET = process.env.SESSION_SECRET ?? "";
const TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS ?? "43200"); // default 12h
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "ws2_metrics_session";

function b64urlEncode(bytes: Uint8Array) {
  let s = Buffer.from(bytes).toString("base64");
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function b64urlDecode(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  return new Uint8Array(Buffer.from(s, "base64"));
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return new Uint8Array(sig);
}

export function getSessionConfig() {
  return {
    cookieName: COOKIE_NAME,
    ttlSeconds: TTL_SECONDS,
    hasSecret: Boolean(SECRET),
  };
}

export async function createSessionCookie(username: string): Promise<{ token: string; maxAge: number }> {
  if (!SECRET) throw new Error("SESSION_SECRET is not set");

  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { u: username, exp: now + TTL_SECONDS };

  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sigBytes = await hmacSha256(SECRET, body);
  const sig = b64urlEncode(sigBytes);

  return { token: `${body}.${sig}`, maxAge: TTL_SECONDS };
}

export async function verifySessionCookie(token: string): Promise<boolean> {
  if (!SECRET) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [body, sig] = parts;

  // verify signature
  const expectedSig = b64urlEncode(await hmacSha256(SECRET, body));
  if (!timingSafeEqual(sig, expectedSig)) return false;

  // verify payload
  let payload: SessionPayload | null = null;
  try {
    const json = new TextDecoder().decode(b64urlDecode(body));
    payload = JSON.parse(json);
  } catch {
    return false;
  }
  if (!payload?.u || typeof payload.exp !== "number") return false;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return false;

  return true;
}

function timingSafeEqual(a: string, b: string) {
  // simple constant-time compare for same-length strings
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
