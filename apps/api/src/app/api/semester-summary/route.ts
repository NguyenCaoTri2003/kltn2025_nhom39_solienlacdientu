import { NextRequest, NextResponse } from "next/server";
import { SemesterSummaryRepository } from "@packages/data/repositories/SemesterSummaryRepository";
import { SemesterSummaryUseCase } from "@packages/core/usecases/SemesterSummaryUseCase";
import { authenticate } from "@packages/utils/auth";

const repo = new SemesterSummaryRepository();
const usecase = new SemesterSummaryUseCase(repo);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = Number(searchParams.get("student_id"));
    const semester_id = searchParams.get("semester_id")
      ? Number(searchParams.get("semester_id"))
      : undefined;

    if (!student_id) {
      return NextResponse.json(
        { returnCode: 1, message: "Missing student_id", data: null },
        { status: 400 }
      );
    }

    const user = authenticate(req);

    // ✅ Chỉ admin hoặc chính sinh viên đó mới xem được
    if (user.role !== "admin" && user.id !== student_id) {
      return NextResponse.json(
        {
          returnCode: 1,
          message: "Forbidden: You can only view your own summaries",
          data: null,
        },
        { status: 403 }
      );
    }

    const summary = await usecase.getStudentSummary(student_id, semester_id);

    return NextResponse.json({
      returnCode: 0,
      message: "Success",
      data: summary,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        returnCode: 1,
        message: e.message || "Internal Server Error",
        data: null,
      },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}
