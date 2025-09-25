import { NextResponse } from "next/server";
import { getAllFaculties } from "../../../../../../packages/core/usecases/FacultiesUseCase";

// http://localhost:3000/api/faculties

export async function GET() {
  try {
    const faculties = await getAllFaculties();

    if (!faculties || (Array.isArray(faculties) && faculties.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "Faculties not found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: faculties });
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


