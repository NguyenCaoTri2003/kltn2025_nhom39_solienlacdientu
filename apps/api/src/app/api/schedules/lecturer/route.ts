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

    const lecturerId = Number(searchParams.get("lecturer_id"));
    const offeringId = searchParams.get("offering_id") ? Number(searchParams.get("offering_id")) : undefined;
    const startDate = searchParams.get("start_date") ?? "";
    const endDate = searchParams.get("end_date") ?? "";

    if (!lecturerId) {
      return NextResponse.json({ error: "Missing lecturer_id" }, { status: 400 });
    }

    if (offeringId) {
      const schedules = await usecase.getLecturerSchedulesOfferingByDate(lecturerId, offeringId, startDate, endDate, user);
      return NextResponse.json(schedules);
    } else {
      const schedules = await usecase.getLecturerSchedulesByDate(lecturerId, startDate, endDate, user);
      return NextResponse.json(schedules);
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}
