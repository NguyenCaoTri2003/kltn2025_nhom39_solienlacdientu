import { NextRequest, NextResponse } from "next/server";
import { AttendanceRepository } from "@packages/data/repositories/AttendanceRepository";
import { AttendanceUseCase } from "@packages/core/usecases/AttendanceUseCase";
import { authenticate } from "@packages/utils/auth";
import { ParentRepository } from "@packages/data/repositories/ParentRepository";

const repo = new AttendanceRepository();
const usecase = new AttendanceUseCase(repo);
const parentRepo = new ParentRepository();

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const { searchParams } = new URL(req.url);

    const studentId = searchParams.get("student_id")
      ? Number(searchParams.get("student_id"))
      : undefined;
    const lecturerId = searchParams.get("lecturer_id")
      ? Number(searchParams.get("lecturer_id"))
      : undefined;
    const offeringId = searchParams.get("offering_id")
      ? Number(searchParams.get("offering_id"))
      : undefined;
    const startDate = searchParams.get("start_date") ?? "";
    const endDate = searchParams.get("end_date") ?? "";
    const date = searchParams.get("date") ?? "";

    if (!["student", "parent", "admin", "lecturer"].includes(user.role)) {
      return NextResponse.json(
        { returnCode: 1, message: "Forbidden" },
        { status: 403 }
      );
    }

    let allowedStudentId: number | undefined = undefined;

    if (user.role === "student") {
      if (studentId && studentId !== user.id) {
        return NextResponse.json(
          { returnCode: 1, message: "Forbidden: Bạn chỉ có thể xem điểm danh của chính mình" },
          { status: 403 }
        );
      }
      allowedStudentId = user.id;
    }

    if (user.role === "parent") {
      if (!studentId) {
        return NextResponse.json(
          { returnCode: 1, message: "Thiếu student_id" },
          { status: 400 }
        );
      }

      const isChild = await parentRepo.isParentOf(user.id, studentId);
      if (!isChild) {
        return NextResponse.json(
          { returnCode: 1, message: "Bạn không có quyền xem điểm danh của sinh viên này" },
          { status: 403 }
        );
      }

      allowedStudentId = studentId;
    }

    if (user.role === "admin") {
      allowedStudentId = studentId;
    }

    if (allowedStudentId) {
      const result = await usecase.getStudentAttendance(
        allowedStudentId,
        user,
        startDate,
        endDate,
        offeringId
      );

      return NextResponse.json({
        returnCode: 0,
        message: "OK",
        data: result,
      });
    }

    if (user.role === "lecturer" && lecturerId && offeringId) {
      const result = await usecase.getOfferingAttendance(
        lecturerId,
        offeringId,
        date
      );

      return NextResponse.json({
        returnCode: 0,
        message: "OK",
        data: result,
      });
    }

    return NextResponse.json(
      { returnCode: 1, message: "Missing required params", data: null },
      { status: 400 }
    );
  } catch (e: any) {
    console.error("==> [API Error] /api/attendance:", e);
    return NextResponse.json(
      {
        returnCode: 1,
        message: e.message || "Internal Server Error",
        data: null,
      },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}

// export async function POST(req: NextRequest) {
//   try {
//     const user = await authenticate(req);
//     if (user.role !== "lecturer") {
//       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//     }

//     const body = await req.json();

//     const offeringId =
//       body.offeringId ?? body.offering_id
//         ? Number(body.offeringId ?? body.offering_id)
//         : null;
//     const enrollment_id =
//       body.enrollmentId ?? body.enrollment_id
//         ? Number(body.enrollmentId ?? body.enrollment_id)
//         : null;
//     const practice_group_id =
//       body.practiceGroupId ?? body.practice_group_id
//         ? Number(body.practiceGroupId ?? body.practice_group_id)
//         : null;
//     const attendance_date = body.attendanceDate ?? body.attendance_date;
//     const type = body.type;
//     const status = body.status;
//     const note = body.note ?? null;

//     // ✅ Validate required fields before building payload
//     if (!offeringId || !enrollment_id || !attendance_date || !type || !status) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const payload = {
//       enrollment_id,          // guaranteed number
//       practice_group_id,      // can be null
//       attendance_date,        // string
//       type,                   // string
//       status,                 // string
//       note,                   // optional
//     };

//     console.log("Final sanitized payload:", payload);

//     const result = await usecase.createAttendance(user.id, offeringId, payload);
//     return NextResponse.json(result, { status: 201 });
//   } catch (e: any) {
//     console.error("POST /api/attendance error:", e);
//     return NextResponse.json({ error: e.message }, { status: 500 });
//   }
// }

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);

    if (user.role !== "lecturer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const offering_id = Number(body.offering_id);
    const student_id = Number(body.student_id);
    const attendance_date = body.attendance_date;
    const type = body.type;
    const status = body.status;
    const practice_group_id =
      body.practice_group_id !== undefined
        ? Number(body.practice_group_id)
        : null;
    const note = body.note ?? null;

    if (!offering_id || !student_id || !attendance_date || !type || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(typeof body.practice_group_id, body.practice_group_id);

    const data = await usecase.upsertAttendanceByStudent(user.id, {
      offering_id: Number(body.offering_id),
      student_id: Number(body.student_id),
      attendance_date: body.attendance_date,
      type: body.type,
      practice_group_id: body.practice_group_id ?? null,
      status: body.status,
      note: body.note ?? null,
    });

    return NextResponse.json({ returnCode: 0, data });
  } catch (e: any) {
    console.error("POST /api/attendance/upsert error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (user.role !== "lecturer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const offeringId = body.offeringId ?? body.offering_id;
    const id = body.id;
    const status = body.status;
    const note = body.note ?? null;

    if (!offeringId || !id || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await usecase.updateAttendance(user.id, offeringId, id, {
      status,
      note,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (user.role !== "lecturer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);

    const offeringId = searchParams.get("offering_id")
      ? Number(searchParams.get("offering_id"))
      : undefined;
    const attendanceId = searchParams.get("id")
      ? Number(searchParams.get("id"))
      : undefined;

    if (!offeringId || !attendanceId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    await usecase.deleteAttendance(user.id, offeringId, attendanceId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}
