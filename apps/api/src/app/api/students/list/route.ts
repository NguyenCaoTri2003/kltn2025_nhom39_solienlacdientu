import { NextRequest, NextResponse } from "next/server";
import { StudentRepository } from "@packages/data/repositories/StudentRepository";

export async function GET(req: NextRequest) {
  try {
    console.log("API called: /api/students/list");

    const studentRepo = new StudentRepository();
    const students = await studentRepo.getListStudent();

    if (!students || students.length === 0) {
      return NextResponse.json(
        {
          returnCode: 1,
          message: "No students found",
          data: null,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        returnCode: 0,
        message: "OK",
        data: students,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("API Error:", err);

    if (err instanceof Error) {
      return NextResponse.json(
        {
          returnCode: 1,
          message: err.message,
          data: null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        returnCode: 1,
        message: "Unknown error",
        data: null,
      },
      { status: 500 }
    );
  }
}
