import { NextRequest, NextResponse } from "next/server";
import { GradeRepository } from "@packages/data/repositories/GradeRepository";
import { GradeUseCase } from "@packages/core/usecases/GradeUseCase";
import { authenticate } from "@packages/utils/auth";

const repo = new GradeRepository();
const usecase = new GradeUseCase(repo);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = Number(searchParams.get("student_id"));
    const offering_id = Number(searchParams.get("offering_id"));
    const semester_id = Number(searchParams.get("semester_id")); // mới

    if (!student_id) {
      return NextResponse.json({ error: "Missing student_id" }, { status: 400 });
    }

    const user = authenticate(req);

    if (offering_id) {
      const grades = await usecase.getGradesByOffering(student_id, offering_id, user);
      return NextResponse.json(grades);
    } else {
      const grades = await usecase.getStudentGrades(student_id, user, semester_id);
      return NextResponse.json(grades);
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "Forbidden" ? 403 : 401 }
    );
  }
}

