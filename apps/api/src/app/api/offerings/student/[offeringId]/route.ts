import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { StudentOfferingUseCase } from "@packages/core/usecases/StudentOfferingCourseUseCase";
import { ParentRepository } from "@packages/data/repositories/ParentRepository";

type Params = { params: { offeringId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await authenticate(req);
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("student_id")
      ? Number(searchParams.get("student_id"))
      : user.id; 

    if (!["student", "parent", "admin"].includes(user.role)) {
      return NextResponse.json({ returnCode: 1, message: "Forbidden" }, { status: 403 });
    }

    const offeringId = Number(params.offeringId);
    if (isNaN(offeringId)) {
      return NextResponse.json({ returnCode: 1, message: "Invalid offering ID" }, { status: 400 });
    }

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

    const usecase = new StudentOfferingUseCase();
    const detail = await usecase.getOfferingDetail(studentId, offeringId);

    if (!detail) {
      return NextResponse.json({ returnCode: 1, message: "Không tìm thấy học phần" }, { status: 404 });
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: detail });
  } catch (err: any) {
    console.error("/api/student/offerings/[offeringId] error:", err);
    return NextResponse.json({ returnCode: 1, message: err.message }, { status: 500 });
  }
}
