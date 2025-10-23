import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { AcademicWarningUseCase } from "@packages/core/usecases/AcademicWarningUseCase";

const uc = new AcademicWarningUseCase();

export async function GET(req: NextRequest, { params }: { params: { studentId: string } }) {
  try {
    const user = await authenticate(req);
    if (!user) return NextResponse.json({ returnCode: -1, message: "Unauthorized", data: null }, { status: 401 });
    // Allow admin and the student themself; expand as needed
    if (user.role !== "admin" && Number(params.studentId) !== user.id)
      return NextResponse.json({ returnCode: -1, message: "Forbidden", data: null }, { status: 403 });

    const studentId = Number(params.studentId);
    const data = await uc.getHistory(studentId);
    return NextResponse.json({ returnCode: 0, message: "OK", data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ returnCode: -1, message, data: null }, { status: 500 });
  }
}
