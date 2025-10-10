import { NextRequest, NextResponse } from "next/server";
import { GradeUseCase } from "@packages/core/usecases/GradeUseCase";
import { authenticate } from "@packages/utils/auth";
import { GradeRepository } from "@packages/data/repositories/GradeRepository";

const repo = new GradeRepository();
const usecase = new GradeUseCase(repo);

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (user.role !== "lecturer" && user.role !== "admin") {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden: Bạn không có quyền truy cập" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const offering_id = Number(searchParams.get("offering_id"));
    const student_id = Number(searchParams.get("student_id"));

    if (!offering_id) {
      return NextResponse.json(
        { returnCode: 1, message: "Thiếu tham số offering_id" },
        { status: 400 }
      );
    }

    let data;
    if (student_id) {
      data = await usecase.getStudentGradesInOffering(student_id, offering_id, user);
    } else {
      data = await usecase.getOfferingGrades(offering_id, user);
    }

    return NextResponse.json({
      returnCode: 0,
      message: "Lấy dữ liệu thành công",
      data,
    });
  } catch (e: any) {
    console.error("Lỗi trong /api/grades:", e);
    return NextResponse.json(
      {
        returnCode: 1,
        message: "Đã xảy ra lỗi khi lấy dữ liệu",
        error: e.message,
      },
      { status: 500 }
    );
  }
}
