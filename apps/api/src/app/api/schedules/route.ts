// import { NextRequest, NextResponse } from "next/server";
// import { ScheduleRepository } from "@packages/data/repositories/ScheduleRepository";
// import { ScheduleUseCase } from "@packages/core/usecases/ScheduleUseCase";
// import { authenticate } from "@packages/utils/auth";

// const repo = new ScheduleRepository();
// const usecase = new ScheduleUseCase(repo);

// export async function GET(req: NextRequest) {
//   try {
//     const user = await authenticate(req);
//     const { searchParams } = new URL(req.url);

//     const studentId = Number(searchParams.get("student_id"));
//     const offeringId = Number(searchParams.get("offering_id"));
//     const startDate = searchParams.get("start_date") ?? "";
//     const endDate = searchParams.get("end_date") ?? "";

//     if (!studentId) {
//       return NextResponse.json({ error: "Missing student_id" }, { status: 400 });
//     }

//     if (offeringId) {
//       const schedule = await usecase.getStudentOfferingScheduleByDate(
//         studentId,
//         offeringId,
//         user,
//         startDate,
//         endDate
//       );
//       return NextResponse.json(schedule);
//     } else {
//       const schedule = await usecase.getStudentSchedulesByDate(
//         studentId,
//         startDate,
//         endDate,
//         user
//       );
//       return NextResponse.json(schedule);
//     }
//   } catch (e: any) {
//     return NextResponse.json(
//       { error: e.message },
//       { status: e.message === "Forbidden" ? 403 : 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { ScheduleRepository } from "@packages/data/repositories/ScheduleRepository";
import { ScheduleUseCase } from "@packages/core/usecases/ScheduleUseCase";
import { authenticate } from "@packages/utils/auth";
import { ParentRepository } from "@packages/data/repositories/ParentRepository";

const repo = new ScheduleRepository();
const usecase = new ScheduleUseCase(repo);
const parentRepo = new ParentRepository();

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const { searchParams } = new URL(req.url);

    const student_id = searchParams.get("student_id")
      ? Number(searchParams.get("student_id"))
      : undefined;
    const offering_id = searchParams.get("offering_id")
      ? Number(searchParams.get("offering_id"))
      : undefined;
    const start_date = searchParams.get("start_date") ?? "";
    const end_date = searchParams.get("end_date") ?? "";

    if (!["student", "parent", "admin"].includes(user.role)) {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden" },
        { status: 403 }
      );
    }

    let allowedStudentId = user.id;

    if (user.role === "parent") {
      if (!student_id) {
        return NextResponse.json(
          { returnCode: 1, message: "Thiếu student_id" },
          { status: 400 }
        );
      }

      const isChild = await parentRepo.isParentOf(user.id, student_id);
      if (!isChild) {
        return NextResponse.json(
          { returnCode: 1, message: "Bạn không có quyền xem thời khóa biểu của sinh viên này" },
          { status: 403 }
        );
      }

      allowedStudentId = student_id;
    }

    if (user.role === "admin" && student_id) {
      allowedStudentId = student_id;
    }

    if (user.role === "student" && student_id && student_id !== user.id) {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden: Bạn chỉ có thể xem lịch của chính mình" },
        { status: 403 }
      );
    }

    let schedule;
    if (offering_id) {
      schedule = await usecase.getStudentOfferingScheduleByDate(
        allowedStudentId,
        offering_id,
        user,
        start_date,
        end_date
      );
    } else {
      schedule = await usecase.getStudentSchedulesByDate(
        allowedStudentId,
        start_date,
        end_date,
        user
      );
    }

    return NextResponse.json(schedule);
  } catch (e: any) {
    console.error("/api/schedule error:", e);
    return NextResponse.json(
      {
        returnCode: 1,
        message: e.message || "Internal Server Error",
      },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}
