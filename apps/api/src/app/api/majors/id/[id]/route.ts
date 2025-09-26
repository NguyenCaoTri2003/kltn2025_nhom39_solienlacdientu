import { NextResponse } from "next/server";
import { getMajorById } from "@/core/usecases/MajorUseCase";

// http://localhost:3000/api/majors/id/[id]

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const major = await getMajorById(id);
    if (!major) {
      return NextResponse.json(
        { returnCode: 1, message: "Major not found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: major });
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


