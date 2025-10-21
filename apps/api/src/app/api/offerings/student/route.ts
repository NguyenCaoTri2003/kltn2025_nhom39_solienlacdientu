// // import { NextRequest, NextResponse } from "next/server";
// // import { getOfferingsByStudent } from "@packages/core/usecases/StudentOfferingCourseUseCase";
// // import { authenticate } from "@packages/utils/auth";

// // export async function GET(req: NextRequest) {
// //   try {
// //     const user = authenticate(req);

// //     // Chỉ cho phép role = student
// //     if (user.role !== "student" && user.role !== "admin") {
// //       return NextResponse.json(
// //         { returnCode: 1, message: "Forbidden", data: null },
// //         { status: 403 }
// //       );
// //     }

// //     const { searchParams } = new URL(req.url);
// //     const semesterIdParam = searchParams.get("semester_id");
// //     const semesterId = semesterIdParam ? Number(semesterIdParam) : undefined;

// //     const courses = await getOfferingsByStudent(user.id, semesterId);

// //     if (!courses || courses.length === 0) {
// //       return NextResponse.json(
// //         { returnCode: 1, message: "No registered courses found", data: null },
// //         { status: 404 }
// //       );
// //     }

// //     return NextResponse.json({
// //       returnCode: 0,
// //       message: "OK",
// //       data: courses,
// //     });
// //   } catch (err: unknown) {
// //     const message = err instanceof Error ? err.message : "Unknown error";
// //       console.error("❌ API /api/offerings/student error:", err);

// //     return NextResponse.json(
// //       { returnCode: 1, message, data: null },
// //       { status: 500 }
// //     );
// //   }
// // }

// import { NextRequest, NextResponse } from "next/server";
// import { authenticate } from "@packages/utils/auth";
// import { getOfferingsByStudent } from "@packages/core/usecases/GetStudentOfferingsUseCase";

// export async function GET(req: NextRequest) {
//   try {
//     const user = authenticate(req);

//     if (user.role !== "student" && user.role !== "admin") {
//       return NextResponse.json({ message: "Forbidden" }, { status: 403 });
//     }

//     const { searchParams } = new URL(req.url);
//     const semesterIdParam = searchParams.get("semester_id");
//     const semesterId = semesterIdParam ? Number(semesterIdParam) : undefined;

//     const data = await getOfferingsByStudent(user.id, semesterId);

//     return NextResponse.json({
//       returnCode: 0,
//       message: "OK",
//       data,
//     });
//   } catch (err) {
//     console.error("❌ /api/student/offerings:", err);
//     const message = err instanceof Error ? err.message : "Unknown error";
//     return NextResponse.json({ returnCode: 1, message, data: null }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { StudentOfferingUseCase } from "@packages/core/usecases/StudentOfferingCourseUseCase";

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (user.role !== "student" && user.role !== "admin") {
      return NextResponse.json({ returnCode: 1, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const semesterId = searchParams.get("semester_id")
      ? Number(searchParams.get("semester_id"))
      : undefined;

    const usecase = new StudentOfferingUseCase();
    const data = await usecase.getOfferingsLite(user.id, semesterId);

    return NextResponse.json({ returnCode: 0, message: "OK", data });
  } catch (err: any) {
    console.error("❌ /api/student/offerings error:", err);
    return NextResponse.json({ returnCode: 1, message: err.message }, { status: 500 });
  }
}
