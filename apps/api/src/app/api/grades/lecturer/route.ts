import { NextRequest, NextResponse } from "next/server";
import { GradeUseCase } from "@/core/usecases/GradeUseCase";
import { authenticate } from "@/utils/auth";
import { GradeRepository } from "@/data/repositories/GradeRepository";

const repo = new GradeRepository();
const usecase = new GradeUseCase(repo);

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (user.role !== "lecturer" && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const offering_id = Number(searchParams.get("offering_id"));
    const student_id = searchParams.get("student_id");

    if (!offering_id) {
      return NextResponse.json({ error: "Missing offering_id" }, { status: 400 });
    }

    if (student_id) {
      const data = await usecase.getStudentGradesInOffering(student_id, offering_id, user);
      return NextResponse.json(data);
    } else {
      const data = await usecase.getOfferingGrades(offering_id, user);
      return NextResponse.json(data);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
