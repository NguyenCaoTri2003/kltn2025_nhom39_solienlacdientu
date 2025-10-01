import { NextResponse } from "next/server";
import { getSemesters } from "@packages/core/usecases/getSemesters";

// http://localhost:3000/api/semesters

export async function GET() {
  try {
    const semesters = await getSemesters();

    if (!semesters || (Array.isArray(semesters) && semesters.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "Semesters not found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: semesters });
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


