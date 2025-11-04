import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { AcademicWarningUseCase } from "@packages/core/usecases/AcademicWarningUseCase";

const academicWarningUseCase = new AcademicWarningUseCase();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const semesterId = searchParams.get("semesterId");

    if (!studentId) {
      return NextResponse.json({ 
        returnCode: -1, 
        message: "Missing studentId parameter", 
        data: null 
      }, { status: 400 });
    }

    const warnings = await academicWarningUseCase.getStudentWarnings(
      parseInt(studentId), 
      semesterId ? parseInt(semesterId) : undefined
    );

    return NextResponse.json({ 
      returnCode: 0, 
      message: "OK", 
      data: warnings 
    }, { status: 200 });
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
