import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { AppointmentUseCase } from "@packages/core/usecases/AppointmentUseCase";
import { AppointmentRepository } from "@packages/data/repositories/AppointmentRepository";

const usecase = new AppointmentUseCase(new AppointmentRepository());

export async function POST(req: NextRequest) {
  try {
    const user = authenticate(req);
    const body = await req.json();

    const { title, content, start_time, end_time, location } = body;

    if (!title || !start_time || !end_time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (user.role === "lecturer") {
      const { studentIds, parentIds } = body;
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return NextResponse.json({ error: "Missing studentIds" }, { status: 400 });
      }

      if (!parentIds || !Array.isArray(parentIds) || parentIds.length === 0) {
        return NextResponse.json({ error: "Missing parentIds" }, { status: 400 });
      }

      const result = await usecase.lecturerCreateAppointments(
        user.id,
        studentIds,
        parentIds,
        title,
        content,
        start_time,
        end_time,
        location
      );

      return NextResponse.json(result, { status: 201 });
    }

    if (user.role === "parent") {
      const { studentId, lecturerId } = body;
      if (!studentId || !lecturerId) {
        return NextResponse.json({ error: "Missing studentId or lecturerId" }, { status: 400 });
      }

      const result = await usecase.parentCreateAppointment(
        user.id,
        studentId,
        lecturerId,
        title,
        content,
        start_time,
        end_time,
        location
      );

      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    const result = await usecase.getAppointments(user);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const result = await usecase.updateAppointment(id, updates);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = authenticate(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const result = await usecase.deleteAppointment(user, Number(id));
    return NextResponse.json({ success: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
