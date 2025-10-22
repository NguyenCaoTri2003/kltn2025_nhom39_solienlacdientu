// import { NextRequest, NextResponse } from "next/server";
// import { authenticate } from "@packages/utils/auth";
// import { StudentOfferingUseCase } from "@packages/core/usecases/StudentOfferingCourseUseCase";

// export async function GET(req: NextRequest) {
//   try {
//     const user = authenticate(req);
//     if (user.role !== "student" && user.role !== "admin") {
//       return NextResponse.json({ returnCode: 1, message: "Forbidden" }, { status: 403 });
//     }

//     const { searchParams } = new URL(req.url);
//     const semesterId = searchParams.get("semester_id")
//       ? Number(searchParams.get("semester_id"))
//       : undefined;

//     const usecase = new StudentOfferingUseCase();
//     const data = await usecase.getOfferingsLite(user.id, semesterId);

//     return NextResponse.json({ returnCode: 0, message: "OK", data });
//   } catch (err: any) {
//     console.error("/api/student/offerings error:", err);
//     return NextResponse.json({ returnCode: 1, message: err.message }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { StudentOfferingUseCase } from "@packages/core/usecases/StudentOfferingCourseUseCase";
import { ParentRepository } from "@packages/data/repositories/ParentRepository";

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    const { searchParams } = new URL(req.url);
    const semesterId = searchParams.get("semester_id")
      ? Number(searchParams.get("semester_id"))
      : undefined;
    const studentId = searchParams.get("student_id")
      ? Number(searchParams.get("student_id"))
      : undefined;

    if (!["student", "parent", "admin"].includes(user.role)) {
      return NextResponse.json({ returnCode: 1, message: "Forbidden" }, { status: 403 });
    }

    const usecase = new StudentOfferingUseCase();
    const parentRepo = new ParentRepository();

    let allowedStudentId = user.id; // mặc định là sinh viên tự xem

    // 👨‍👩‍👧 Nếu là phụ huynh → xác thực student_id có phải con mình không
    if (user.role === "parent") {
      if (!studentId) {
        return NextResponse.json({
          returnCode: 1,
          message: "Thiếu student_id",
        });
      }

      const isChild = await parentRepo.isParentOf(user.id, studentId);
      if (!isChild) {
        return NextResponse.json({
          returnCode: 1,
          message: "Bạn không có quyền xem sinh viên này",
        });
      }

      allowedStudentId = studentId;
    }

    const data = await usecase.getOfferingsLite(allowedStudentId, semesterId);
    return NextResponse.json({ returnCode: 0, message: "OK", data });
  } catch (err: any) {
    console.error("/api/student/offerings error:", err);
    return NextResponse.json({ returnCode: 1, message: err.message }, { status: 500 });
  }
}
