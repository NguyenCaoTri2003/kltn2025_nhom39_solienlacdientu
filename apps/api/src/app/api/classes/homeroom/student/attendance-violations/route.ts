import { NextRequest, NextResponse } from "next/server";
import { StudentUseCase } from "@packages/core/usecases/StudentUseCase";
import { StudentRepository } from "@packages/data/repositories/StudentRepository";
import { ClassesRepository } from "@packages/data/repositories/ClassesRepository";

const studentRepo = new StudentRepository();
const classRepo = new ClassesRepository();
const usecase = new StudentUseCase(studentRepo, undefined, classRepo);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = Number(searchParams.get("student_id"));

    if (!studentId) {
      return NextResponse.json(
        { message: "Thiếu student_id" },
        { status: 400 }
      );
    }

    const data = await usecase.getAttendanceViolations(studentId);

    return NextResponse.json({
      returnCode: 0,
      data,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      {
        returnCode: -1,
        message: error.message ?? "Lỗi server",
      },
      { status: 500 }
    );
  }
}