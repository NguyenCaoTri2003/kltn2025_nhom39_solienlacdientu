import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { canManageAcademic } from "@packages/utils/adminPermissions";
import { academicWarningV3UseCase } from "@packages/core/usecases/AcademicWarningV3UseCase";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { returnCode: -1, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    if (!canManageAcademic(user)) {
      return NextResponse.json(
        { returnCode: -1, message: "You do not have permission to manage academic affairs!", data: null },
        { status: 403 }
      );
    }

    interface MarkWarnedBody {
      studentId?: number | string;
      semesterId?: number | string;
      level?: "FIRST" | "SECOND" | "FINAL" | string;
    }

    let body: MarkWarnedBody | null = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid JSON body", data: null },
        { status: 400 }
      );
    }

    const { studentId, semesterId, level } = body || {};

    if (studentId == null || semesterId == null || !level) {
      return NextResponse.json(
        { returnCode: -1, message: "Missing required fields: studentId, semesterId, level", data: null },
        { status: 400 }
      );
    }

    const levelStr = String(level).toUpperCase();
    const allowedLevels = new Set(["FIRST", "SECOND", "FINAL"]);
    if (!allowedLevels.has(levelStr)) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid level. Use one of: FIRST|SECOND|FINAL", data: null },
        { status: 400 }
      );
    }

    console.log("Marking student as warned:", { studentId, semesterId, level: levelStr });

    // Kiểm tra xem đã có cảnh cáo nào cho student + semester này chưa
    const isAlreadyWarned = await academicWarningV3UseCase.isStudentWarned(Number(studentId), Number(semesterId));
    if (isAlreadyWarned) {
      return NextResponse.json({
        returnCode: -1,
        message: `Sinh viên đã được cảnh cáo trong học kỳ này. Mỗi học kỳ chỉ được cảnh cáo 1 lần.`,
        data: null,
      }, { status: 400 });
    }

    // Đánh dấu student đã được cảnh cáo
    await academicWarningV3UseCase.markStudentAsWarned(Number(studentId), Number(semesterId), levelStr);

    return NextResponse.json({
      returnCode: 0,
      message: "Student marked as warned successfully",
      data: {
        studentId: Number(studentId),
        semesterId: Number(semesterId),
        level: levelStr,
        markedAt: new Date().toISOString()
      },
    });
  } catch (err) {
    const e = err as { message?: string; error_description?: string; hint?: string } | undefined;
    const message = (e && (e.message || e.error_description || e.hint)) || "Unknown error";
    console.error("Mark warned error:", err);
    return NextResponse.json(
      { returnCode: -1, message, data: null },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
