// import { NextRequest, NextResponse } from "next/server";
// import { authenticate } from "@packages/utils/auth";
// import { getOfferingDetailByEnrollment } from "@packages/core/usecases/GetStudentOfferingDetailUseCase";

// interface Params {
//   params: {
//     offeringId: string;
//   };
// }

// export async function GET(req: NextRequest, { params }: Params) {
//   try {
//     const user = authenticate(req);

//     if (user.role !== "student" && user.role !== "admin") {
//       return NextResponse.json({ message: "Forbidden" }, { status: 403 });
//     }

//     const enrollmentId = Number(params.offeringId);
//     if (isNaN(enrollmentId)) {
//       return NextResponse.json({ message: "Invalid offering ID" }, { status: 400 });
//     }

//     const data = await getOfferingDetailByEnrollment(enrollmentId);
//     if (!data) {
//       return NextResponse.json({ message: "Not found" }, { status: 404 });
//     }

//     return NextResponse.json({
//       returnCode: 0,
//       message: "OK",
//       data,
//     });
//   } catch (err) {
//     console.error("❌ /api/student/offerings/[offeringId]:", err);
//     const message = err instanceof Error ? err.message : "Unknown error";
//     return NextResponse.json({ returnCode: 1, message, data: null }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { StudentOfferingUseCase } from "@packages/core/usecases/StudentOfferingCourseUseCase";

type Params = { params: { offeringId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = authenticate(req);
    if (user.role !== "student" && user.role !== "admin") {
      return NextResponse.json({ returnCode: 1, message: "Forbidden" }, { status: 403 });
    }

    const offeringId = Number(params.offeringId);
    if (isNaN(offeringId)) {
      return NextResponse.json({ returnCode: 1, message: "Invalid ID" }, { status: 400 });
    }

    const usecase = new StudentOfferingUseCase();
    const detail = await usecase.getOfferingDetail(user.id, offeringId);

    if (!detail) {
      return NextResponse.json({ returnCode: 1, message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ returnCode: 0, message: "OK", data: detail });
  } catch (err: any) {
    console.error("❌ /api/student/offerings/[offeringId] error:", err);
    return NextResponse.json({ returnCode: 1, message: err.message }, { status: 500 });
  }
}
