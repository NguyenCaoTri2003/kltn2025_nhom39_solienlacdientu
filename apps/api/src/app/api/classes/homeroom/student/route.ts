import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { StudentRepository } from "@packages/data/repositories/StudentRepository"
import { GradeRepository } from "@packages/data/repositories/GradeRepository"
import { StudentUseCase } from "@packages/core/usecases/StudentUseCase"
import { ClassesRepository } from "@packages/data/repositories/ClassesRepository";

const studentRepo = new StudentRepository()
const gradeRepo = new GradeRepository()
const classRepo = new ClassesRepository();
const usecase = new StudentUseCase(studentRepo, gradeRepo, classRepo)

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (user.role !== "lecturer") {
      return NextResponse.json({ returnCode: 1, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = Number(searchParams.get("class_id"));
    if (!classId) {
      return NextResponse.json({ returnCode: 1, message: "Missing class_id" }, { status: 400 });
    }

    const students = await usecase.getStudentsWithParentsByClassForLecturer(classId, user.id);

    return NextResponse.json({ returnCode: 0, message: "OK", data: students });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      {
        returnCode: 1,
        message: e.message || "Internal Server Error",
        data: null,
      },
      { status: e.status || 500 }
    );
  }
}
