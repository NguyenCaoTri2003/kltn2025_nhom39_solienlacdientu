import { NextRequest, NextResponse } from "next/server";
import { AttendanceRepository } from "@packages/data/repositories/AttendanceRepository";
import { AttendanceUseCase } from "@packages/core/usecases/AttendanceUseCase";
import { authenticate } from "@packages/utils/auth";

const repo = new AttendanceRepository();
const usecase = new AttendanceUseCase(repo);

export async function GET(req: NextRequest) {
  try {
    console.log("==> [API] /api/attendance called");

    const user = await authenticate(req); // nếu bạn chưa cần auth có thể comment dòng này
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
    const startDate = searchParams.get("start_date") ?? undefined;
    const endDate = searchParams.get("end_date") ?? undefined;
    const date = searchParams.get("date") ?? undefined;

    // ✅ Lấy điểm danh của sinh viên cụ thể
    if (studentId) {
      const result = await usecase.getStudentAttendance(
        studentId,
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

    // ✅ Lấy điểm danh của lớp học phần
    if (lecturerId && offeringId) {
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

    // ❌ Thiếu tham số
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

//     const offeringId = body.offeringId ?? body.offering_id;
//     const enrollment_id = body.enrollmentId ?? body.enrollment_id;
//     const practice_group_id = body.practiceGroupId ?? body.practice_group_id ?? null;
//     const attendance_date = body.attendanceDate ?? body.attendance_date;
//     const type = body.type;
//     const status = body.status;
//     const note = body.note ?? null;

//     if (!offeringId || !attendance_date || !type || !status) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     try {
//       const result = await usecase.createAttendance(user.id, offeringId, {
//         enrollment_id,
//         practice_group_id,
//         attendance_date,
//         type,
//         status,
//         note,
//       });
//       return NextResponse.json(result, { status: 201 });
//     } catch (err: any) {
//       console.error("Error in createAttendance:", err); 
//       return NextResponse.json(
//         { error: err.message },
//         { status: 500 }
//       );
//     }

//   } catch (e: any) {
//     console.error("Unexpected error in POST /api/attendance:", e);
//     return NextResponse.json(
//       { error: e.message },
//       { status: e.message === "Forbidden" ? 403 : 500 }
//     );
//   }
// }

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (user.role !== "lecturer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const offeringId =
      body.offeringId ?? body.offering_id ? Number(body.offeringId ?? body.offering_id) : null;
    const enrollment_id =
      body.enrollmentId ?? body.enrollment_id ? Number(body.enrollmentId ?? body.enrollment_id) : null;
    const practice_group_id =
      body.practiceGroupId ?? body.practice_group_id
        ? Number(body.practiceGroupId ?? body.practice_group_id)
        : null;
    const attendance_date = body.attendanceDate ?? body.attendance_date ?? null;
    const type = body.type ?? null;
    const status = body.status ?? null;
    const note = body.note ?? null;

    if (!offeringId || !attendance_date || !type || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const payload = {
      enrollment_id,
      practice_group_id,
      attendance_date,
      type,
      status,
      note,
    };

    console.log("Final sanitized payload to createAttendance:", payload);

    try {
      const result = await usecase.createAttendance(user.id, offeringId, payload);
      return NextResponse.json(result, { status: 201 });
    } catch (err: any) {
      console.error("Error in createAttendance:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  } catch (e: any) {
    console.error("Unexpected error in POST /api/attendance:", e);
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
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
