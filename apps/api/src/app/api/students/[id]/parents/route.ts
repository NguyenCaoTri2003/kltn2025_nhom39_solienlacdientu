import { NextRequest, NextResponse } from "next/server";
import { StudentRepository } from "@packages/data/repositories/StudentRepository";

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const studentId = Number(context.params.id);
    if (!Number.isFinite(studentId) || studentId <= 0) {
      return NextResponse.json({ returnCode: -1, message: "Invalid student id", data: null }, { status: 400 });
    }

    const repo = new StudentRepository();
    const items = await repo.getStudentParents(studentId);

    return NextResponse.json({ returnCode: 0, message: "OK", data: items }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ returnCode: -1, message, data: null }, { status: 500 });
  }
}

