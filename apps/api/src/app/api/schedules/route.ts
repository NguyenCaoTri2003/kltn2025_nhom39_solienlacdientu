import { NextRequest, NextResponse } from "next/server";
import { ScheduleRepository } from "@/data/repositories/ScheduleRepository";
import { ScheduleUseCase } from "@/core/usecases/ScheduleUseCase";
import { authenticate } from "@/utils/auth";

const repo = new ScheduleRepository();
const usecase = new ScheduleUseCase(repo);

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    const { searchParams } = new URL(req.url);

    const studentId = Number(searchParams.get("student_id"));
    const offeringId = Number(searchParams.get("offering_id"));
    const startDate = searchParams.get("start_date") ?? "";
    const endDate = searchParams.get("end_date") ?? "";

    if (!studentId) {
      return NextResponse.json({ error: "Missing student_id" }, { status: 400 });
    }

    if (offeringId) {
      const schedule = await usecase.getStudentOfferingScheduleByDate(
        studentId,
        offeringId,
        user,
        startDate,
        endDate
      );
      return NextResponse.json(schedule);
    } else {
      const schedule = await usecase.getStudentSchedulesByDate(
        studentId,
        startDate,
        endDate,
        user
      );
      return NextResponse.json(schedule);
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}
