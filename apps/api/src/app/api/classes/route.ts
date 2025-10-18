import { NextRequest, NextResponse } from "next/server";
import { getAllClasses } from "@packages/core/usecases/ClassesUseCase";
import { authenticate } from "@packages/utils/auth";

// GET /api/classes
export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    const data = await getAllClasses(user);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { returnCode: 1, message: "Classes not found", data: null },
        { status: 404 }
      );
    }

    const res = NextResponse.json({ returnCode: 0, message: "OK", data });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isUnauthorized = message === "No token" || message === "Invalid token";
    const status =
      message === "You do not have access!" ? 403 : isUnauthorized ? 401 : 500;

    const res = NextResponse.json(
      { returnCode: -1, message, data: null },
      { status }
    );
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
