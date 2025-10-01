import { NextResponse } from "next/server";
import { getOfferingsByCourse } from "@packages/core/usecases/OfferingsUseCase";

// http://localhost:3000/api/offerings/[courseId]

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = Number(params.courseId);
    const offerings = await getOfferingsByCourse(courseId);

    if (!offerings || (Array.isArray(offerings) && offerings.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "Offerings not found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: offerings });
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


