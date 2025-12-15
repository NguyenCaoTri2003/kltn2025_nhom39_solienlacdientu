import { NextRequest, NextResponse } from "next/server";
import { ScheduleRepository } from "@packages/data/repositories/ScheduleRepository";
import { ScheduleUseCase } from "@packages/core/usecases/ScheduleUseCase";
import { authenticate } from "@packages/utils/auth";

const repo = new ScheduleRepository();
const usecase = new ScheduleUseCase(repo);

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const { searchParams } = new URL(req.url);

    const offeringId = searchParams.get("offering_id")
      ? Number(searchParams.get("offering_id"))
      : undefined;

    const lecturerId = searchParams.get("lecturer_id")
      ? Number(searchParams.get("lecturer_id"))
      : undefined;

    if (!["lecturer", "admin"].includes(user.role)) {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden", data: null },
        { status: 403 }
      );
    }

    if (!offeringId || !lecturerId) {
      return NextResponse.json(
        {
          returnCode: 1,
          message: "Missing required params: offering_id, lecturer_id",
          data: null,
        },
        { status: 400 }
      );
    }

    /**
     * Lecturer chỉ được xem lịch của chính mình
     * Admin thì xem ai cũng được
     */
    if (user.role === "lecturer" && user.id !== lecturerId) {
      return NextResponse.json(
        {
          returnCode: 1,
          message: "Forbidden: Không được xem lịch của giảng viên khác",
          data: null,
        },
        { status: 403 }
      );
    }

    const result = await usecase.getOfferingScheduleToAttendance(offeringId, lecturerId, user);

    return NextResponse.json({
      returnCode: 0,
      message: "OK",
      data: result,
    });
  } catch (e: any) {
    console.error("==> [API Error] /api/attendance/schedule:", e);

    return NextResponse.json(
      {
        returnCode: 1,
        message: e.message || "Internal Server Error",
        data: null,
      },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}
