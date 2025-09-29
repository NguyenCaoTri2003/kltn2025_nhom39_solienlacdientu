import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const FRONTEND_ORIGIN = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001";

export function middleware(req: NextRequest) {
  console.log("Middleware API - CORS");

  if (req.nextUrl.pathname.startsWith("/api")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": FRONTEND_ORIGIN,
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }

    const res = NextResponse.next();
    res.headers.set("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.headers.set("Access-Control-Allow-Credentials", "true");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
