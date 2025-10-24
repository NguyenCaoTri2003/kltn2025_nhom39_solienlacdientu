import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { AcademicWarningUseCase } from "@packages/core/usecases/AcademicWarningUseCase";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";
import { translateWarningLevel } from "@packages/utils/translations";

const uc = new AcademicWarningUseCase();

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user || user.role !== "admin")
      return NextResponse.json({ returnCode: -1, message: "Forbidden", data: null }, { status: 403 });

    const body = await req.json();
    const { studentId, semesterId, level, reason } = body ?? {};
    if (!studentId || !semesterId || !level || !reason) {
      return NextResponse.json({ returnCode: -1, message: "Missing fields", data: null }, { status: 400 });
    }

    const created = await uc.createWarning({ studentId: Number(studentId), semesterId: Number(semesterId), level: String(level), reason: String(reason) });

    // tạo notification cho sinh viên
    try {
      const viLevel = translateWarningLevel(String(level).toUpperCase());
      const content = `Cảnh cáo học vụ (${viLevel}): ${String(reason)}`;
      await notificationsUseCase.create({
        user_id: Number(studentId),
        content,
        type: "university",
        category: "ACADEMIC",
      });
    } catch (notifyErr) {
      console.warn("Failed to create notification for academic warning:", notifyErr); 
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ returnCode: -1, message, data: null }, { status: 500 });
  }
}
