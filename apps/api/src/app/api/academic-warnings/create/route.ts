import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { AcademicWarningUseCase } from "@packages/core/usecases/AcademicWarningUseCase";

const uc = new AcademicWarningUseCase();

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      const res = NextResponse.json(
        { returnCode: -1, message: "Unauthorized", data: null },
        { status: 401 }
      );
      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res;
    }

    if (user.role !== "admin") {
      const res = NextResponse.json(
        { returnCode: -1, message: "Forbidden", data: null },
        { status: 403 }
      );
      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res;
    }

  interface CreateWarningBody { studentId?: number | string; semesterId?: number | string; level?: string; reason?: string }
  let body: CreateWarningBody | null = null;
    try {
      body = await req.json();
    } catch {
      const res = NextResponse.json(
        { returnCode: -1, message: "Invalid JSON body", data: null },
        { status: 400 }
      );
      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res;
    }

    const { studentId, semesterId, level, reason } = body || {};

    if (studentId == null || semesterId == null || !level || !reason) {
      const res = NextResponse.json(
        { returnCode: -1, message: "Missing required fields", data: null },
        { status: 400 }
      );
      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res;
    }

    const levelStr = String(level).toLowerCase();
    const allowedLevels = new Set(["minor", "moderate", "major"]);
    if (!allowedLevels.has(levelStr)) {
      const res = NextResponse.json(
        { returnCode: -1, message: "Invalid level. Use one of: minor|moderate|major", data: null },
        { status: 400 }
      );
      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res;
    }

    const warning = await uc.createWarning({
      studentId: Number(studentId),
      semesterId: Number(semesterId),
      level: levelStr,
      reason,
    });

    const res = NextResponse.json({
      returnCode: 0,
      message: "Academic warning created successfully",
      data: warning,
    });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  } catch (err) {

  const e = err as { message?: string; error_description?: string; hint?: string } | undefined;
  const message = (e && (e.message || e.error_description || e.hint)) || "Unknown error";
  console.error("Create warning error:", err);
    const res = NextResponse.json(
      { returnCode: -1, message, data: null },
      { status: 500 }
    );
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
