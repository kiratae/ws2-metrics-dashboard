import { NextResponse } from "next/server";
import { createSessionCookie, getSessionConfig } from "@/lib/auth";

export async function POST(req: Request) {
  const { hasSecret, cookieName, ttlSeconds } = getSessionConfig();

  if (!hasSecret) {
    return NextResponse.json({ error: "SESSION_SECRET is not set" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const user = String(body?.user ?? "");
  const pass = String(body?.pass ?? "");
  const next = String(body?.next ?? "/dashboard");

  const expectedUser = process.env.DASH_USER ?? "";
  const expectedPass = process.env.DASH_PASS ?? "";

  if (!expectedUser || !expectedPass) {
    return NextResponse.json({ error: "DASH_USER/DASH_PASS is not set" }, { status: 500 });
  }

  if (user !== expectedUser || pass !== expectedPass) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const { token, maxAge } = await createSessionCookie(user);

  const res = NextResponse.json({ redirectTo: next, ttlSeconds });
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  return res;
}
