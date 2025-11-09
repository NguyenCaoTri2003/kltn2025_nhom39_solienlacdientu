import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { AcademicWarningUseCase } from "@packages/core/usecases/AcademicWarningUseCase";

const academicWarningUseCase = new AcademicWarningUseCase();

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid or missing token", data: null },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { returnCode: -1, message: "Permission denied: Admin only", data: null },
        { status: 403 }
      );
    }

    const count = await academicWarningUseCase.getTotalCount();

    return NextResponse.json({
      returnCode: 0,
      message: "OK",
      data: { count },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized = message === "No token" || message === "Invalid token" || message === "Token expired";
    const status = isUnauthorized ? 401 : 500;
    return NextResponse.json({ returnCode: -1, message, data: null }, { status });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

