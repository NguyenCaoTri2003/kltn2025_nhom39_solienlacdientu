import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { ParentRepository } from "@packages/data/repositories/ParentRepository";
import { InvoicesUseCase } from "@packages/core/usecases/InvoicesUseCase";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const { searchParams } = new URL(req.url);

    const semesterId = Number(searchParams.get("semester_id"));
    const studentId = searchParams.get("student_id")
      ? Number(searchParams.get("student_id"))
      : user.id;

    if (!["student", "parent"].includes(user.role)) {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden" },
        { status: 403 }
      );
    }

    if (!semesterId || isNaN(semesterId)) {
      return NextResponse.json(
        { returnCode: 1, message: "Thiếu hoặc sai semester_id" },
        { status: 400 }
      );
    }

    // Nếu là phụ huynh → kiểm tra có phải con mình không
    if (user.role === "parent") {
      const parentRepo = new ParentRepository();
      const isChild = await parentRepo.isParentOf(user.id, studentId);
      if (!isChild) {
        return NextResponse.json({
          returnCode: 1,
          message: "Bạn không có quyền xem học phí của sinh viên này",
        });
      }
    }

    const usecase = new InvoicesUseCase();
    const invoices = await usecase.execute(studentId, semesterId);

    return NextResponse.json({
      returnCode: 0,
      message: "OK",
      data: invoices,
    });
  } catch (err: any) {
    console.error(" /api/student/invoices error:", err);
    return NextResponse.json(
      { returnCode: 1, message: err.message },
      { status: 500 }
    );
  }
}
