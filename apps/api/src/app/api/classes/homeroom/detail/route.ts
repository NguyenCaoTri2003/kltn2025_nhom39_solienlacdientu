import { NextRequest, NextResponse } from "next/server";
import { ClassesUseCase } from "@packages/core/usecases/ClassesUseCase";
import { authenticate } from "@packages/utils/auth";

const usecase = new ClassesUseCase();

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);

    if (user.role !== "lecturer") {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const classIdParam = searchParams.get("class_id");

    if (!classIdParam) {
      return NextResponse.json(
        { returnCode: 1, message: "Missing class_id" },
        { status: 400 }
      );
    }

    const classId = Number(classIdParam);

    const classData = await usecase.getHomeroomClassDetail(classId, user);

    return NextResponse.json({
      returnCode: 0,
      message: "OK",
      data: classData,
    });
  } catch (e: any) {
    console.error("/api/classes/homeroom error:", e);

    if (e.message === "NOT_HOMEROOM_LECTURER") {
      return NextResponse.json(
        {
          returnCode: 1,
          message: "Bạn không phải giảng viên chủ nhiệm của lớp này",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        returnCode: 1,
        message: e.message || "Internal Server Error",
      },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}