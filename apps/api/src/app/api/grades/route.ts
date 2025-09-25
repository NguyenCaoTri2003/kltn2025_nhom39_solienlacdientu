import { NextRequest, NextResponse } from "next/server";
import { GradeRepository } from "@/data/repositories/GradeRepository";
import { GradeUseCase } from "@/core/usecases/GradeUseCase";
import { authenticate } from "@/utils/auth";

const repo = new GradeRepository();
const usecase = new GradeUseCase(repo);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = Number(searchParams.get("student_id"));
    const offering_id = Number(searchParams.get("offering_id"));

    if (!student_id) {
      return NextResponse.json({ error: "Missing student_id" }, { status: 400 });
    }

    const user = authenticate(req);

    if (offering_id) {
      const grades = await usecase.getGradesByOffering(student_id, offering_id, user);
      return NextResponse.json(grades);
    } else {
      const grades = await usecase.getStudentGrades(student_id, user);
      return NextResponse.json(grades);
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "Forbidden" ? 403 : 401 }
    );
  }
}
