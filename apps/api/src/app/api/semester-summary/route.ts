// import { NextRequest, NextResponse } from "next/server";
// import { SemesterSummaryRepository } from "@packages/data/repositories/SemesterSummaryRepository";
// import { SemesterSummaryUseCase } from "@packages/core/usecases/SemesterSummaryUseCase";
// import { authenticate } from "@packages/utils/auth";

// const repo = new SemesterSummaryRepository();
// const usecase = new SemesterSummaryUseCase(repo);

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const student_id = Number(searchParams.get("student_id"));
//     const semester_id = searchParams.get("semester_id")
//       ? Number(searchParams.get("semester_id"))
//       : undefined;

//     if (!student_id) {
//       return NextResponse.json(
//         { returnCode: 1, message: "Missing student_id", data: null },
//         { status: 400 }
//       );
//     }

//     const user = await authenticate(req);

//     // ✅ Chỉ admin hoặc chính sinh viên đó mới xem được
//     if (user.role !== "admin" && user.id !== student_id) {
//       return NextResponse.json(
//         {
//           returnCode: 1,
//           message: "Forbidden: You can only view your own summaries",
//           data: null,
//         },
//         { status: 403 }
//       );
//     }

//     const summary = await usecase.getStudentSummary(student_id, semester_id);

//     return NextResponse.json({
//       returnCode: 0,
//       message: "Success",
//       data: summary,
//     });
//   } catch (e: any) {
//     return NextResponse.json(
//       {
//         returnCode: 1,
//         message: e.message || "Internal Server Error",
//         data: null,
//       },
//       { status: e.message === "Forbidden" ? 403 : 500 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { SemesterSummaryRepository } from "@packages/data/repositories/SemesterSummaryRepository";
import { SemesterSummaryUseCase } from "@packages/core/usecases/SemesterSummaryUseCase";
import { authenticate } from "@packages/utils/auth";
import { ParentRepository } from "@packages/data/repositories/ParentRepository";

const repo = new SemesterSummaryRepository();
const usecase = new SemesterSummaryUseCase(repo);
const parentRepo = new ParentRepository();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id")
      ? Number(searchParams.get("student_id"))
      : undefined;
    const semester_id = searchParams.get("semester_id")
      ? Number(searchParams.get("semester_id"))
      : undefined;

    const user = await authenticate(req);

    if (!["student", "parent", "admin"].includes(user.role)) {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden", data: null },
        { status: 403 }
      );
    }

    let allowedStudentId = user.id;

    if (user.role === "parent") {
      if (!student_id) {
        return NextResponse.json(
          { returnCode: 1, message: "Thiếu student_id", data: null },
          { status: 400 }
        );
      }

      const isChild = await parentRepo.isParentOf(user.id, student_id);
      if (!isChild) {
        return NextResponse.json(
          {
            returnCode: 1,
            message: "Bạn không có quyền xem tổng kết của sinh viên này",
            data: null,
          },
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
        {
          returnCode: 1,
          message: "Forbidden: Bạn chỉ có thể xem tổng kết của chính mình",
          data: null,
        },
        { status: 403 }
      );
    }

    const summary = await usecase.getStudentSummary(allowedStudentId, semester_id);

    return NextResponse.json({
      returnCode: 0,
      message: "Success",
      data: summary,
    });
  } catch (e: any) {
    console.error("/api/semester-summary error:", e);
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
