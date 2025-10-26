import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { AppointmentUseCase } from "@packages/core/usecases/AppointmentUseCase";
import { AppointmentRepository } from "@packages/data/repositories/AppointmentRepository";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";
import { supabase } from "@packages/data/supabaseClient";

const usecase = new AppointmentUseCase(new AppointmentRepository());

// export async function POST(req: NextRequest) {
//   try {
//     const user = await authenticate(req);
//     const body = await req.json();

//     const { title, content, start_time, end_time, location } = body;

//     if (!title || !start_time || !end_time) {
//       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
//     }

//     if (user.role === "lecturer") {
//       const { studentIds, parentIds } = body;
//       if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
//         return NextResponse.json({ error: "Missing studentIds" }, { status: 400 });
//       }

//       if (!parentIds || !Array.isArray(parentIds) || parentIds.length === 0) {
//         return NextResponse.json({ error: "Missing parentIds" }, { status: 400 });
//       }

//       const result = await usecase.lecturerCreateAppointments(
//         user.id,
//         studentIds,
//         parentIds,
//         title,
//         content,
//         start_time,
//         end_time,
//         location
//       );

//       return NextResponse.json(result, { status: 201 });
//     }

//     if (user.role === "parent") {
//       const { studentId, lecturerId } = body;
//       if (!studentId || !lecturerId) {
//         return NextResponse.json({ error: "Missing studentId or lecturerId" }, { status: 400 });
//       }

//       const result = await usecase.parentCreateAppointment(
//         user.id,
//         studentId,
//         lecturerId,
//         title,
//         content,
//         start_time,
//         end_time,
//         location
//       );

//       return NextResponse.json(result, { status: 201 });
//     }

//     return NextResponse.json({ error: "Forbidden" }, { status: 403 });
//   } catch (e: any) {
//     return NextResponse.json({ error: e.message }, { status: 400 });
//   }
// }

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
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

      const { data: lecturerUser, error: lecturerError } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (lecturerError || !lecturerUser) {
        console.error(lecturerError);
        return NextResponse.json({ error: "Không tìm thấy thông tin giảng viên" }, { status: 404 });
      }

      const lecturerName = lecturerUser.full_name;

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

      const notifications = parentIds.map((pid: number) =>
        notificationsUseCase.create({
          user_id: pid,
          title: "Lịch hẹn mới với giảng viên",
          content: `Giảng viên ${lecturerName} đã tạo lịch hẹn: "${title}" vào lúc ${new Date(
            start_time
          ).toLocaleString("vi-VN")}.`,
          type: "lecturer",
          category: "APPOINTMENT" as any,
        })
      );

      await Promise.all(notifications);

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
    console.error(e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const result = await usecase.getAppointments(user);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

// export async function PATCH(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { id, ...updates } = body;

//     if (!id) {
//       return NextResponse.json({ error: "Missing id" }, { status: 400 });
//     }

//     const result = await usecase.updateAppointment(id, updates);
//     return NextResponse.json(result);
//   } catch (e: any) {
//     return NextResponse.json({ error: e.message }, { status: 400 });
//   }
// }

export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const result = await usecase.updateAppointment(id, updates);

    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id, title, start_time, end_time, lecturer_id, parent_id, location")
      .eq("id", id)
      .single();

    if (fetchError || !appointment) {
      console.error(fetchError);
      return NextResponse.json({ error: "Không tìm thấy lịch hẹn" }, { status: 404 });
    }

    const { data: lecturerUser, error: lecturerError } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", appointment.lecturer_id)
      .single();

    const lecturerName = lecturerUser?.full_name || "Giảng viên";

    if (appointment.parent_id) {
      const notificationContent = `${lecturerName} đã cập nhật lịch hẹn "${appointment.title}" — thời gian mới: ${new Date(
        appointment.start_time
      ).toLocaleString("vi-VN")} tại ${appointment.location || "địa điểm cũ"}.`;

      await notificationsUseCase.create({
        user_id: appointment.parent_id,
        title: "Lịch hẹn đã được cập nhật",
        content: notificationContent,
        type: "lecturer",
        category: "APPOINTMENT" as any,
      });
    }

    return NextResponse.json({
      message: "Cập nhật lịch hẹn và gửi thông báo cho phụ huynh thành công",
      data: result,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Internal error" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticate(req);
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
