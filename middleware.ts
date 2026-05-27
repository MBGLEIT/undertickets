import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin") {
    return NextResponse.next();
  }

  const hasAdminSession =
    request.cookies.get(ADMIN_COOKIE_NAME)?.value === "granted";

  if (hasAdminSession) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin";
  url.searchParams.set("redirectTo", pathname);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
