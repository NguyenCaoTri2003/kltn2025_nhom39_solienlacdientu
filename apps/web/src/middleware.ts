import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { cookies, nextUrl } = req;

  const token = cookies.get("token")?.value;
  const userCookie = cookies.get("user")?.value;
  const user = userCookie ? JSON.parse(userCookie) : null;

  const protectedPaths = ["/admin", "/lecturer"];

  if (protectedPaths.some((path) => nextUrl.pathname.startsWith(path))) {
    if (!token || !user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (nextUrl.pathname.startsWith("/admin") && user.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (nextUrl.pathname.startsWith("/lecturer") && user.role !== "lecturer") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/lecturer/:path*"],
};
