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

    if (!studentId) {
      return NextResponse.json({ error: "Missing student_id" }, { status: 400 });
    }

    if (offeringId) {
      const schedule = await usecase.getStudentOfferingSchedule(studentId, offeringId, user);
      return NextResponse.json(schedule);
    } else {
      const schedule = await usecase.getStudentSchedules(studentId, user);
      return NextResponse.json(schedule);
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === "Forbidden" ? 403 : 500 });
  }
}
