// apps/api/app/api/teacher/schedule/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { ScheduleRepository } from "@packages/data/repositories/ScheduleRepository";
import { ScheduleUseCase } from "@packages/core/usecases/ScheduleUseCase";

const repo = new ScheduleRepository();
const usecase = new ScheduleUseCase(repo);

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const { searchParams } = new URL(req.url);

    let lecturerId = user.id;

    if (user.role === "admin") {
      const paramLecturer = searchParams.get("lecturer_id");
      if (!paramLecturer) {
        return NextResponse.json(
          { message: "Missing lecturer_id" },
          { status: 400 }
        );
      }
      lecturerId = Number(paramLecturer);
    }

    if (user.role === "lecturer") {
      const paramLecturer = searchParams.get("lecturer_id");
      if (paramLecturer && Number(paramLecturer) !== user.id) {
        return NextResponse.json(
          { message: "Forbidden: cannot view other lecturers' schedules" },
          { status: 403 }
        );
      }
      lecturerId = user.id;
    }

    if (!["lecturer", "admin"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const schedules = await usecase.getLecturerTodaySchedules(lecturerId);

    return NextResponse.json({
      returnCode: 0,
      data: schedules,
    });
  } catch (e: any) {
    console.error("GET /api/schedules/today/lecturer error:", e);
    return NextResponse.json(
      {
        returnCode: 1,
        message: e.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
