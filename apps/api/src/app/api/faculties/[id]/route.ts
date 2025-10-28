// import { NextResponse } from "next/server";
// import { getFaculties } from "../../../../../../../packages/core/usecases/getFaculties";

// export async function GET(
//   req: Request,
//   { params }: { params: { id: number } }
// ) {
//   try {
//     const id = Number(params.id);
//     const faculties = await getFaculties(id);
//     return NextResponse.json(faculties);
//   } catch (err: unknown) {
//     if (err instanceof Error) {
//       return NextResponse.json({ error: err.message }, { status: 500 });
//     }
//     return NextResponse.json({ error: "Unknown error" }, { status: 500 });
//   }
// }



import { NextResponse } from "next/server";
import { getFacultyById } from "../../../../../../../packages/core/usecases/FacultiesUseCase";

// http://localhost:3000/api/faculties/[id]

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const faculty = await getFacultyById(id);

    if (!faculty) {
      return NextResponse.json(
        { returnCode: 1, message: "Faculty not found", data: null },
        { status: 404 }
      );
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: faculty });
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
