import { NextResponse } from "next/server";
import { getMajorsByFaculty } from "../../../../../../../packages/core/usecases/getMajorsByFaculty";
import { getFaculties } from "../../../../../../../packages/core/usecases/getFaculties";

// http://localhost:3000/api/majors/[facultyId]

export async function GET(
  req: Request,
  { params }: { params: { facultyId: string } }
) {
  try {
    const facultyId = Number(params.facultyId);
    const [majors, faculties] = await Promise.all([
      getMajorsByFaculty(facultyId),
      getFaculties(facultyId),
    ]);

    const faculty = Array.isArray(faculties) ? faculties[0] : faculties;

    if (!faculty) {
      return NextResponse.json(
        { returnCode: 1, message: "Faculty not found", data: null },
        { status: 404 }
      );
    }

    if (!majors || (Array.isArray(majors) && majors.length === 0)) {
      return NextResponse.json(
        { returnCode: 1, message: "Majors not found", data: { faculty_name: faculty.name, majors: [] } },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: { faculty_name: faculty.name, majors } });
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


