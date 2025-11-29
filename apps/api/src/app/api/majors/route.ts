import { NextResponse } from "next/server";
import { getAllMajors } from "@packages/core/usecases/MajorUseCase";

// http://localhost:3000/api/majors

export async function GET() {
  try {
    const majors = await getAllMajors();

    if (!majors || (Array.isArray(majors) && majors.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "Majors not found", data: [] },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: majors });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json(
        { returnCode: 1, message: err.message, data: null },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { returnCode: 1, message: "Unknown error", data: null },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

