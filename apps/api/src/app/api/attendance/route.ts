import { NextRequest, NextResponse } from "next/server";
import { AttendanceRepository } from "@packages/data/repositories/AttendanceRepository";
import { AttendanceUseCase } from "@packages/core/usecases/AttendanceUseCase";
import { authenticate } from "@packages/utils/auth";

const repo = new AttendanceRepository();
const usecase = new AttendanceUseCase(repo);

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req); 
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

    if (studentId) {
      const result = await usecase.getStudentAttendance(
        studentId,
        user,
        startDate,
        endDate,
        offeringId
      );
      return NextResponse.json(result);
    }

    if (lecturerId && offeringId) {
      const result = await usecase.getOfferingAttendance(
        lecturerId,
        offeringId,
        date
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Missing required params" },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (user.role !== "lecturer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const offeringId = body.offeringId ?? body.offering_id;
    const enrollment_id = body.enrollmentId ?? body.enrollment_id;
    const practice_group_id = body.practiceGroupId ?? body.practice_group_id ?? null;
    const attendance_date = body.attendanceDate ?? body.attendance_date;
    const type = body.type;
    const status = body.status;
    const note = body.note ?? null;

    if (!offeringId || !enrollment_id || !attendance_date || !type || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await usecase.createAttendance(user.id, offeringId, {
      enrollment_id,
      practice_group_id,
      attendance_date,
      type,
      status,
      note,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = authenticate(req);
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
    const user = authenticate(req);
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
