import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { StudentOfferingUseCase } from "@packages/core/usecases/StudentOfferingCourseUseCase";
import { ParentRepository } from "@packages/data/repositories/ParentRepository";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const { searchParams } = new URL(req.url);

    const studentId = searchParams.get("student_id")
      ? Number(searchParams.get("student_id"))
      : user.id;

    const offeringId = searchParams.get("offering_id")
      ? Number(searchParams.get("offering_id"))
      : undefined;

    if (!["student", "parent", "admin"].includes(user.role)) {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden" },
        { status: 403 }
      );
    }

    if (!offeringId || isNaN(offeringId)) {
      return NextResponse.json(
        { returnCode: 1, message: "Thiếu hoặc sai offering_id" },
        { status: 400 }
      );
    }

    // 👨‍👩‍👧 Nếu là phụ huynh thì kiểm tra student_id có phải con mình không
    if (user.role === "parent") {
      const parentRepo = new ParentRepository();
      const isChild = await parentRepo.isParentOf(user.id, studentId);
      if (!isChild) {
        return NextResponse.json({
          returnCode: 1,
          message: "Bạn không có quyền xem học phần của sinh viên này",
        });
      }
    }

    // 🧩 Lấy thông tin chi tiết học phần
    const usecase = new StudentOfferingUseCase();
    const detail = await usecase.getOfferingDetail(studentId, offeringId);

    if (!detail) {
      return NextResponse.json(
        { returnCode: 1, message: "Không tìm thấy học phần" },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: detail });
  } catch (err: any) {
    console.error("❌ /api/student/offerings/detail error:", err);
    return NextResponse.json(
      { returnCode: 1, message: err.message },
      { status: 500 }
    );
  }
}