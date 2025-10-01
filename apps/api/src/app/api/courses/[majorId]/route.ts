import { NextResponse } from "next/server";
import { getCoursesByMajor } from "@packages/core/usecases/CoursesUseCase";

// http://localhost:3000/api/courses/[majorId]

export async function GET(
  req: Request,
  { params }: { params: { majorId: string } }
) {
  try {
    const majorId = Number(params.majorId);
    const courses = await getCoursesByMajor(majorId);

    if (!courses || (Array.isArray(courses) && courses.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "Courses not found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: courses });
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


