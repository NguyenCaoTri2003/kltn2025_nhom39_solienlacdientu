import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { ScheduleRepository } from "@packages/data/repositories/ScheduleRepository";
import { ScheduleUseCase } from "@packages/core/usecases/ScheduleUseCase";
import { ParentRepository } from "@packages/data/repositories/ParentRepository";

const repo = new ScheduleRepository();
const usecase = new ScheduleUseCase(repo);
const parentRepo = new ParentRepository();

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const { searchParams } = new URL(req.url);

    const student_id_raw = searchParams.get("student_id");
    let requestedStudentId = student_id_raw ? Number(student_id_raw) : undefined;

    if (!["student", "parent", "admin"].includes(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    let allowedStudentId = user.id;

    if (user.role === "student") {
      if (requestedStudentId && requestedStudentId !== user.id) {
        return NextResponse.json(
          { message: "Bạn chỉ được xem lịch của chính bạn" },
          { status: 403 }
        );
      }
      allowedStudentId = user.id;
    }

    if (user.role === "parent") {
      if (!requestedStudentId)
        return NextResponse.json(
          { message: "Thiếu student_id" },
          { status: 400 }
        );

      const ok = await parentRepo.isParentOf(user.id, requestedStudentId);
      if (!ok)
        return NextResponse.json(
          { message: "Bạn không có quyền xem lịch của sinh viên này" },
          { status: 403 }
        );

      allowedStudentId = requestedStudentId;
    }

    if (user.role === "admin" && requestedStudentId) {
      allowedStudentId = requestedStudentId;
    }

    const result = await usecase.getStudentTodaySchedules(allowedStudentId);

    return NextResponse.json({
      returnCode: 0,
      data: result,
    });
  } catch (e: any) {
    console.error("GET /api/schedules/today/student error:", e);
    return NextResponse.json(
      {
        returnCode: 1,
        message: e.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
