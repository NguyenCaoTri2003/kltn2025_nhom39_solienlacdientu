// import { NextRequest, NextResponse } from "next/server";
// import { GradeRepository } from "@packages/data/repositories/GradeRepository";
// import { GradeUseCase } from "@packages/core/usecases/GradeUseCase";
// import { authenticate } from "@packages/utils/auth";

// const repo = new GradeRepository();
// const usecase = new GradeUseCase(repo);

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const student_id = Number(searchParams.get("student_id"));
//     const offering_id = Number(searchParams.get("offering_id"));
//     const semester_id = Number(searchParams.get("semester_id")); // mới

//     if (!student_id) {
//       return NextResponse.json({ error: "Missing student_id" }, { status: 400 });
//     }

//     const user = authenticate(req);

//     if (offering_id) {
//       const grades = await usecase.getGradesByOffering(student_id, offering_id, user);
//       return NextResponse.json(grades);
//     } else {
//       const grades = await usecase.getStudentGrades(student_id, user, semester_id);
//       return NextResponse.json(grades);
//     }
//   } catch (e: any) {
//     return NextResponse.json(
//       { error: e.message },
//       { status: e.message === "Forbidden" ? 403 : 401 }
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { GradeRepository } from "@packages/data/repositories/GradeRepository";
import { GradeUseCase } from "@packages/core/usecases/GradeUseCase";
import { authenticate } from "@packages/utils/auth";
import { ParentRepository } from "@packages/data/repositories/ParentRepository";

const repo = new GradeRepository();
const usecase = new GradeUseCase(repo);
const parentRepo = new ParentRepository();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id")
      ? Number(searchParams.get("student_id"))
      : undefined;
    const offering_id = searchParams.get("offering_id")
      ? Number(searchParams.get("offering_id"))
      : undefined;
    const semester_id = searchParams.get("semester_id")
      ? Number(searchParams.get("semester_id"))
      : undefined;

    const user = authenticate(req);

    if (!["student", "parent", "admin"].includes(user.role)) {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden" },
        { status: 403 }
      );
    }

    let allowedStudentId = user.id; 

    if (user.role === "parent") {
      if (!student_id) {
        return NextResponse.json(
          { returnCode: 1, message: "Thiếu student_id" },
          { status: 400 }
        );
      }

      const isChild = await parentRepo.isParentOf(user.id, student_id);
      if (!isChild) {
        return NextResponse.json(
          { returnCode: 1, message: "Bạn không có quyền xem sinh viên này" },
          { status: 403 }
        );
      }

      allowedStudentId = student_id;
    }

    if (user.role === "admin" && student_id) {
      allowedStudentId = student_id;
    }

    let grades;
    if (offering_id) {
      grades = await usecase.getGradesByOffering(
        allowedStudentId,
        offering_id,
        user
      );
    } else {
      grades = await usecase.getStudentGrades(
        allowedStudentId,
        user,
        semester_id
      );
    }

    return NextResponse.json(grades);
  } catch (e: any) {
    console.error("/api/student/grades error:", e);
    return NextResponse.json(
      { returnCode: 1, message: e.message },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}
