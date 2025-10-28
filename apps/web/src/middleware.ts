// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function middleware(req: NextRequest) {
//   const { cookies, nextUrl } = req;

//   const token = cookies.get("token")?.value;
//   const userCookie = cookies.get("user")?.value;
//   const user = userCookie ? JSON.parse(userCookie) : null;

//   const protectedPaths = ["/admin", "/lecturer"];

//   if (protectedPaths.some((path) => nextUrl.pathname.startsWith(path))) {
//     if (!token || !user) {
//       return NextResponse.redirect(new URL("/login", req.url));
//     }

//     if (nextUrl.pathname.startsWith("/admin") && user.role !== "admin") {
//       return NextResponse.redirect(new URL("/login", req.url));
//     }
//     if (nextUrl.pathname.startsWith("/lecturer") && user.role !== "lecturer") {
//       return NextResponse.redirect(new URL("/login", req.url));
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/admin/:path*", "/lecturer/:path*"],
// };

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { cookies, nextUrl } = req;

  const { pathname } = nextUrl;

  // 🚫 Bỏ qua trang login để tránh vòng lặp
  if (pathname.startsWith("/portal/login") || pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const token = cookies.get("token")?.value;
  const userCookie = cookies.get("user")?.value;
  const user = userCookie ? JSON.parse(userCookie) : null;

  const protectedPaths = ["/admin", "/lecturer", "/portal"];

  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    if (!token || !user) {
      if (pathname.startsWith("/portal")) {
        return NextResponse.redirect(new URL("/portal/login", req.url));
      }
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/admin") && user.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/lecturer") && user.role !== "lecturer") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (pathname.startsWith("/portal") && !["student", "parent"].includes(user.role)) {
      return NextResponse.redirect(new URL("/portal/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/lecturer/:path*", "/portal/:path*"],
};