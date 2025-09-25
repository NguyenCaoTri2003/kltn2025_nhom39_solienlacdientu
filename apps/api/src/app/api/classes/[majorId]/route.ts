import { NextResponse } from "next/server";
import { getClassesByMajor } from "../../../../../../../packages/core/usecases/getClassesByMajors";


// http://localhost:3000/api/classes/[majorId]

export async function GET(
  req: Request,
  { params }: { params: { majorId: string } }
) {
  try {
    const majorId = Number(params.majorId);
    const classesList = await getClassesByMajor(majorId);

    if (!classesList || (Array.isArray(classesList) && classesList.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "Classes not found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: classesList });
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


