// import { NextRequest, NextResponse } from "next/server";
// import { authenticate } from "@packages/utils/auth";
// import { StudentRepository } from "@packages/data/repositories/StudentRepository";

// /**
//  * GET /api/students/[id]/failed-courses   vẫn chưua biết có tác dụng gì. vì không biết môn nào pass
//  */
// export async function GET(
//   req: NextRequest,
//   ctx: { params: Promise<{ id: string }> }
// ) {
//   try {
//     const headerToken = req.headers.get("authorization");
//     const cookieToken = req.cookies.get("token")?.value;
//     if (!headerToken && !cookieToken) {
//       return NextResponse.json(
//         { returnCode: -1, message: "No token", data: null },
//         { status: 401 }
//       );
//     }

//     const { id: userId, role } = await authenticate(req);
//     const { id: studentId } = await ctx.params;

//     if (role !== "admin" && role !== "lecturer" && String(userId) !== String(studentId)) {
//       return NextResponse.json(
//         { returnCode: -1, message: "Unauthorized access", data: null },
//         { status: 403 }
//       );
//     }

//     const { searchParams } = new URL(req.url);
//     const semesterIdParam = searchParams.get("semesterId");
//     const semesterId = semesterIdParam ? Number(semesterIdParam) : undefined;

//     const repo = new StudentRepository();
//     const result = await repo.getStudentFailedCourses(studentId, semesterId);

//     return NextResponse.json(
//       { returnCode: 0, message: "OK", data: result },
//       { status: 200 }
//     );
//   } catch (e: unknown) {
//     const message = e instanceof Error ? e.message : "System error";
//     const isUnauthorized =
//       message === "No token" || message === "Invalid token" || message === "Token expired";
//     const status = isUnauthorized ? 401 : 500;

//     return NextResponse.json(
//       { returnCode: -1, message, data: null },
//       { status }
//     );
//   }
// }
