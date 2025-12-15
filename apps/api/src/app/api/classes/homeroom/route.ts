import { NextRequest, NextResponse } from "next/server";
import { ClassesUseCase } from "@packages/core/usecases/ClassesUseCase";
import { authenticate } from "@packages/utils/auth";

const usecase = new ClassesUseCase();

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);

    if (user.role !== "lecturer") {
      return NextResponse.json({ returnCode: 1, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const semesterId = searchParams.get("semester_id") ? Number(searchParams.get("semester_id")) : undefined;

    const classes = await usecase.getHomeroomClassesByLecturer(user.id, semesterId);

    return NextResponse.json({ returnCode: 0, message: "OK", data: classes });
  } catch (e: any) {
    console.error("/api/classes/homeroom error:", e);
    return NextResponse.json(
      { returnCode: 1, message: e.message || "Internal Server Error", data: null },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}
