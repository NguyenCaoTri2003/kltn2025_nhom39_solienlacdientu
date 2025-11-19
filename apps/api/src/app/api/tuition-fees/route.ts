import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { ParentRepository } from "@packages/data/repositories/ParentRepository";
import { TuitionFeesUseCase } from "@packages/core/usecases/TuitionFeesUseCase";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const { searchParams } = new URL(req.url);

    const semesterId = searchParams.get("semester_id")
      ? Number(searchParams.get("semester_id"))
      : null;

    const studentId = searchParams.get("student_id")
      ? Number(searchParams.get("student_id"))
      : user.id;

    if (!["student", "parent"].includes(user.role)) {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Nếu là phụ huynh thì phải kiểm tra có phải con mình không
    if (user.role === "parent") {
      const parentRepo = new ParentRepository();
      const isChild = await parentRepo.isParentOf(user.id, studentId);

       console.log("Is child:", isChild);

      if (!isChild) {
        return NextResponse.json({
          returnCode: 1,
          message: "Bạn không có quyền xem học phí của sinh viên này",
        });
      }
    }

    const usecase = new TuitionFeesUseCase();
    const fees = await usecase.execute(studentId, semesterId);

    return NextResponse.json({
      returnCode: 0,
      message: "OK",
      data: fees,
    });
  } catch (err: any) {
    console.error("GET /api/student/tuition-fees error:", err);
    return NextResponse.json(
      { returnCode: 1, message: err.message },
      { status: 500 }
    );
  }
}
