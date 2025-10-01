import { NextRequest, NextResponse } from "next/server";
import { getOfferingsByLecturer } from "@/core/usecases/OfferingsUseCase";
import { authenticate } from "@/utils/auth";

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);

    if (user.role !== "lecturer" && user.role !== "admin") {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden", data: null },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const semesterIdParam = searchParams.get("semester_id");
    const semesterId = semesterIdParam ? Number(semesterIdParam) : undefined;

    const offerings = await getOfferingsByLecturer(user.id, semesterId);

    if (!offerings || offerings.length === 0) {
      return NextResponse.json(
        { returnCode: 1, message: "No course offerings found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({
      returnCode: 0,
      message: "OK",
      data: offerings,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { returnCode: 1, message, data: null },
      { status: 500 }
    );
  }
}
