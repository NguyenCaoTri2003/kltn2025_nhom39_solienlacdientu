import { NextRequest, NextResponse } from "next/server";
import { GradeUseCase } from "@/core/usecases/GradeUseCase";
import { GradeRepository } from "@/data/repositories/GradeRepository";
import { authenticate } from "@/utils/auth";

const repo = new GradeRepository();
const useCase = new GradeUseCase(repo);

export async function GET(req: NextRequest) {
  try {
    const payload = authenticate(req);

    const url = new URL(req.url);
    const student_id = url.searchParams.get("student_id");
    const offering_id = url.searchParams.get("offering_id");

    if (!student_id) {
      return NextResponse.json({ error: "Missing student_id" }, { status: 400 });
    }

    if (payload.id !== Number(student_id) && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (offering_id) {
      const grades = await useCase.getOfferingGrades(Number(student_id), Number(offering_id));
      return NextResponse.json(grades);
    } else {
      const grades = await useCase.getStudentGrades(Number(student_id));
      return NextResponse.json(grades);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
