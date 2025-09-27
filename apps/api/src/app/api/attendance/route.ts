import { NextRequest, NextResponse } from "next/server";
import { AttendanceRepository } from "@/data/repositories/AttendanceRepository";
import { AttendanceUseCase } from "@/core/usecases/AttendanceUseCase";
import { authenticate } from "@/utils/auth";

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
    const body = await req.json();

    const {
      lecturerId,
      offeringId,
      enrollment_id,
      practice_group_id,
      attendance_date,
      type,
      status,
      note,
    } = body;

    if (!lecturerId || !offeringId || !enrollment_id || !attendance_date || !type || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await usecase.createAttendance(lecturerId, offeringId, {
      enrollment_id,
      practice_group_id,
      attendance_date,
      type,
      status,
      note
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
    const body = await req.json();

    const { lecturerId, offeringId, id, status, note } = body;
    if (!lecturerId || !offeringId || !id || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await usecase.updateAttendance(
      lecturerId,
      offeringId,
      id,
      { status, note }
    );

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
    const { searchParams } = new URL(req.url);

    const lecturerId = searchParams.get("lecturer_id")
      ? Number(searchParams.get("lecturer_id"))
      : undefined;
    const offeringId = searchParams.get("offering_id")
      ? Number(searchParams.get("offering_id"))
      : undefined;
    const attendanceId = searchParams.get("id")
      ? Number(searchParams.get("id"))
      : undefined;

    if (!lecturerId || !offeringId || !attendanceId) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    await usecase.deleteAttendance(lecturerId, offeringId, attendanceId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === "Forbidden" ? 403 : 500 }
    );
  }
}
