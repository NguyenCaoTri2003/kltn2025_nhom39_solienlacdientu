import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { AcademicWarningUseCase } from "@packages/core/usecases/AcademicWarningUseCase";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";
import { translateWarningLevel } from "@packages/utils/translations";
import { StudentRepository } from "@packages/data/repositories/StudentRepository";
import { UserRepository } from "@packages/data/repositories/UserRepository";

const uc = new AcademicWarningUseCase();

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { returnCode: -1, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { returnCode: -1, message: "Forbidden", data: null },
        { status: 403 }
      );
    }

  interface CreateWarningBody {
    studentId?: number | string;
    semesterId?: number | string;
    level?: "FIRST" | "SECOND" | "FINAL" | string;
    reason?: string;
    cumulativeGpa?: number | string | null;
    debtCredits?: number | string | null;
    progressStatus?: string | null;
    note?: string | null;
  }
  let body: CreateWarningBody | null = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid JSON body", data: null },
        { status: 400 }
      );
    }

  const { studentId, semesterId, level, reason, cumulativeGpa, debtCredits, progressStatus, note } = body || {};

    if (studentId == null || semesterId == null || !level || !reason) {
      return NextResponse.json(
        { returnCode: -1, message: "Missing required fields", data: null },
        { status: 400 }
      );
    }

    const levelStr = String(level).toUpperCase();
    const allowedLevels = new Set(["FIRST", "SECOND", "FINAL"]);
    if (!allowedLevels.has(levelStr)) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid level. Use one of: FIRST|SECOND|FINAL", data: null },
        { status: 400 }
      );
    }

    console.log("Bắt đầu tạo cảnh cáo học vụ...");
    console.log("Student ID:", studentId, "Semester ID:", semesterId, "Level:", levelStr);

    // Bước 1: Tạo dòng trong academic_warnings
    console.log("Tạo dòng trong academic_warnings...");
    const warning = await uc.createWarning({
      studentId: Number(studentId),
      semesterId: Number(semesterId),
      level: levelStr,
      reason,
      createdBy: user.id,
      cumulativeGpa: cumulativeGpa != null ? Number(cumulativeGpa) : null,
      debtCredits: debtCredits != null ? Number(debtCredits) : null,
      progressStatus: progressStatus ?? null,
      note: note ?? null,
    });
    console.log("Tạo academic warning thành công! ID:", warning.id);

    // Tạo notifications cho sinh viên và phụ huynh
    try {
      const viLevel = translateWarningLevel(levelStr);
      const title = `Cảnh cáo học vụ (${viLevel})`;

      // Bước 1: Lấy thông tin sinh viên và danh sách phụ huynh
      console.log("Lấy thông tin sinh viên và danh sách phụ huynh...");
      const studentRepo = new StudentRepository();
      const userRepo = new UserRepository();
      const [studentInfo, parents] = await Promise.all([
        userRepo.findById(Number(studentId)),
        studentRepo.getStudentParents(Number(studentId))
      ]);
      
      const studentName = studentInfo?.full_name || "Sinh viên";
      console.log("Tìm thấy", parents?.length || 0, "phụ huynh:", parents?.map(p => p.parent_id) || []);
      console.log("Tên sinh viên:", studentName);

      // Bước 2: Tạo 1 notification chính (không gán user_id)
      console.log("Tạo notification chính...");
      const content = `Cảnh cáo học vụ ${viLevel} cho sinh viên ${studentName}. Lý do: ${reason}`;
      const notification = await notificationsUseCase.create({
        user_id: null, // Không gán cho user cụ thể
        title,
        content,
        type: "university",
        category: "ACADEMIC",
      });
      console.log("Tạo notification chính thành công! ID:", notification.id);

      // Bước 3: Tạo user_notifications cho sinh viên và phụ huynh
      const userIds = [Number(studentId)]; // Thêm student
      if (parents && parents.length > 0) {
        userIds.push(...parents.map(p => p.parent_id)); // Thêm parents
      }
      
      console.log("Tạo user_notifications cho", userIds.length, "users:", userIds);
      
      for (const userId of userIds) {
        try {
          await notificationsUseCase.createUserNotification(userId, notification.id);
          console.log("Tạo user_notification cho user ID:", userId, "thành công!");
        } catch (userNotifyErr) {
          console.error("Lỗi tạo user_notification cho user ID:", userId, userNotifyErr);
        }
      }
      
      console.log("Hoàn thành tạo cảnh cáo học vụ và notifications!");

    } catch (notifyErr) {
      console.error("Lỗi khi tạo notifications:", notifyErr); 
    }

    return NextResponse.json({
      returnCode: 0,
      message: "Academic warning created successfully",
      data: warning,
    });
  } catch (err) {

  const e = err as { message?: string; error_description?: string; hint?: string } | undefined;
  const message = (e && (e.message || e.error_description || e.hint)) || "Unknown error";
  console.error("Create warning error:", err);
    return NextResponse.json(
      { returnCode: -1, message, data: null },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
