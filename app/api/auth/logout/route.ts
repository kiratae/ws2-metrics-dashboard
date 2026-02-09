import { NextResponse } from "next/server";
import { getSessionConfig } from "@/lib/auth";

export async function POST() {
  const { cookieName } = getSessionConfig();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
