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

    // 👉 Kiểm tra role
    if (!["student", "parent", "admin"].includes(user.role)) {
      return NextResponse.json({ returnCode: 1, message: "Forbidden" }, { status: 403 });
    }

    const usecase = new StudentOfferingUseCase();

    let studentIds: number[] = [];

    if (user.role === "student") {
      studentIds = [user.id];
    } else if (user.role === "parent") {
      const parentRepo = new ParentRepository();
      const children = await parentRepo.getChildrenByParentId(user.id);
      console.log("Children of parent", user.id, children);
      studentIds = children.map((c: any) => c.student_id);
      if (studentIds.length === 0) {
        return NextResponse.json({ returnCode: 0, message: "Không có con nào", data: [] });
      }
    }

    // ✅ Lấy offerings của tất cả student_id con
    const results = await Promise.all(
      studentIds.map((sid) => usecase.getOfferingsLite(sid, semesterId))
    );

    // Gộp tất cả lại (nếu phụ huynh có nhiều con)
    const data = results.flat();

    return NextResponse.json({ returnCode: 0, message: "OK", data });
  } catch (err: any) {
    console.error("/api/student/offerings error:", err);
    return NextResponse.json({ returnCode: 1, message: err.message }, { status: 500 });
  }
}
