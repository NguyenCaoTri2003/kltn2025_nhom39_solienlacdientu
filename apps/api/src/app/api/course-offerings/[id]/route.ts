import { NextRequest, NextResponse } from "next/server";
import { getOfferingDetail } from "@packages/core/usecases/CourseOfferingUseCase";
import { authenticate } from "@packages/utils/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { returnCode: 1, message: "Invalid ID" },
        { status: 400 }
      );
    }

    const user = authenticate(req);
    const data = await getOfferingDetail(id, user);

    if (!data) {
      return NextResponse.json(
        { returnCode: 1, message: "Offering not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, data });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json(
      { returnCode: 1, message: "Internal server error" },
      { status: 500 }
    );
  }
}
