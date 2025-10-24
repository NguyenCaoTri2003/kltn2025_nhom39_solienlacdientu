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

      // Bước 2: Tạo notification cho sinh viên
      console.log("Tạo notification cho sinh viên...");
      const studentContent = `Bạn đã nhận cảnh cáo học vụ ${viLevel}. Lý do: ${reason}`;
      const notification = await notificationsUseCase.create({
        user_id: Number(studentId), // Gán cho sinh viên
        title,
        content: studentContent,
        type: "university",
        category: "ACADEMIC",
      });
      console.log("Tạo notification thành công! ID:", notification.id, "cho user:", studentId);

      // Bước 3: Lấy thông tin sinh viên và danh sách phụ huynh
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

      // Bước 4: Tạo notifications riêng cho phụ huynh với format khác
      if (parents && parents.length > 0) {
        const parentContent = `Gửi phụ huynh: Em ${studentName} đã nhận cảnh cáo học vụ ${viLevel}. Lý do: ${reason}`;
        const parentTitle = `Thông báo cảnh cáo học vụ - ${studentName}`;
        
        console.log("Tạo notifications riêng cho", parents.length, "phụ huynh...");
        
        for (const parent of parents) {
          try {
            await notificationsUseCase.create({
              user_id: parent.parent_id,
              title: parentTitle,
              content: parentContent,
              type: "university",
              category: "ACADEMIC",
            });
            console.log("Tạo notification cho phụ huynh ID:", parent.parent_id, "thành công!");
          } catch (parentErr) {
            console.error("Lỗi tạo notification cho phụ huynh ID:", parent.parent_id, parentErr);
          }
        }
        console.log("Tạo notifications cho phụ huynh thành công!");
      } else {
        console.log("Không có phụ huynh nào để tạo notification");
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
