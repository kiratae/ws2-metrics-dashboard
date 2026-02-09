import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/auth";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "ws2_metrics_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow login + static assets
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon")
  ) {
    return NextResponse.next();
  }

  // protect dashboard and root
  if (pathname === "/" || pathname.startsWith("/dashboard")) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const ok = token ? await verifySessionCookie(token) : false;

    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
