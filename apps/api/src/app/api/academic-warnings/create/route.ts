import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { academicWarningV3UseCase } from "@packages/core/usecases/AcademicWarningV3UseCase";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";
import { translateWarningLevel } from "@packages/utils/translations";
import { StudentRepository } from "@packages/data/repositories/StudentRepository";
import { UserRepository } from "@packages/data/repositories/UserRepository";

// Cache cho student info để tránh query nhiều lần
interface CachedStudentInfo {
  name: string;
  parents: Array<{ parent_id: number }>;
  timestamp: number;
}
const studentInfoCache = new Map<number, CachedStudentInfo>();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

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
    const allowedLevels = new Set(["FIRST", "SECOND", "FINAL", "EXPULSION"]);
    if (!allowedLevels.has(levelStr)) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid level. Use one of: FIRST|SECOND|FINAL|EXPULSION", data: null },
        { status: 400 }
      );
    }

    console.log("Bắt đầu tạo cảnh cáo học vụ...");
    console.log("Student ID:", studentId, "Semester ID:", semesterId, "Level:", levelStr);

    // Bước 0: Kiểm tra duplicate warning - nếu đã có cảnh cáo cho student + semester này thì không cho tạo
    console.log("Kiểm tra duplicate warning...");
    const isAlreadyWarned = await academicWarningV3UseCase.isStudentWarned(Number(studentId), Number(semesterId));
    
    if (isAlreadyWarned) {
      console.warn(`Student ${studentId} đã có cảnh cáo trong semester ${semesterId}`);
      return NextResponse.json(
        { returnCode: -1, message: `Sinh viên đã được cảnh cáo trong học kỳ này. Mỗi học kỳ chỉ được cảnh cáo 1 lần.`, data: null },
        { status: 400 }
      );
    }

    // Bước 1: Tạo dòng trong academic_warnings (với transaction)
    console.log("Tạo dòng trong academic_warnings...");
    const warning = await academicWarningV3UseCase.createWarning({
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
    let studentNotification: { id: number } | null = null;
    let parents: Array<{ parent_id: number }> = [];
    let studentName = "Sinh viên";
    
    try {
      const viLevel = translateWarningLevel(levelStr);
      const title = `Cảnh cáo học vụ (${viLevel})`;

      // Bước 1: Lấy thông tin sinh viên và danh sách phụ huynh (với cache)
      console.log("Lấy thông tin sinh viên và danh sách phụ huynh...");
      const studentRepo = new StudentRepository();
      const userRepo = new UserRepository();
      
      const cacheKey = Number(studentId);
      const cached = studentInfoCache.get(cacheKey);
      const now = Date.now();
      
      let studentInfo;
      
      if (cached && (now - cached.timestamp) < CACHE_TTL) {
        console.log("Sử dụng cache cho student:", studentId);
        studentName = cached.name;
        parents = cached.parents;
        studentInfo = { full_name: studentName }; 
      } else {

        const [studentInfoResult, parentsResult] = await Promise.all([
          userRepo.findById(Number(studentId)),
          studentRepo.getStudentParents(Number(studentId))
        ]);
        
        studentInfo = studentInfoResult;
        parents = parentsResult || [];
        
        if (!studentInfo) {
          console.error("Student not found:", studentId);
          return NextResponse.json(
            { returnCode: -1, message: "Student not found", data: null },
            { status: 404 }
          );
        }
        
        studentName = studentInfo?.full_name || "Sinh viên";
        
        studentInfoCache.set(cacheKey, {
          name: studentName,
          parents: parents,
          timestamp: now
        });
      }
      
      console.log("Tìm thấy", parents?.length || 0, "phụ huynh:", parents?.map(p => p.parent_id) || []);
      console.log("Tên sinh viên:", studentName);

      // Bước 2: Tạo notification cho sinh viên
      console.log("Tạo notification cho sinh viên...");
      const studentContent = `Bạn đã nhận cảnh cáo học vụ ${viLevel}. Lý do: ${reason}`;
      studentNotification = await notificationsUseCase.create({
        user_id: Number(studentId),
        title,
        content: studentContent,
        type: "university",
        category: "ACADEMIC",
        target_student_id: Number(studentId),
      });
      console.log("Tạo notification cho sinh viên thành công! ID:", studentNotification.id);

      // Bước 3: Tạo notifications riêng cho phụ huynh (tối ưu hóa với Promise.allSettled)
      if (parents && parents.length > 0) {
        console.log("Tạo notifications cho", parents.length, "phụ huynh...");
        
        const parentNotifications = parents.map(parent => {
          const parentTitle = `Thông báo cảnh cáo học vụ - ${studentName}`;
          const parentContent = `Gửi phụ huynh: Em ${studentName} đã nhận cảnh cáo học vụ ${viLevel}. Lý do: ${reason}`;
          
          return notificationsUseCase.create({
            user_id: parent.parent_id,
            title: parentTitle,
            content: parentContent,
            type: "university",
            category: "ACADEMIC",
            target_student_id: Number(studentId),
          }).then(() => {
            console.log("Tạo notification cho phụ huynh ID:", parent.parent_id, "thành công!");
            return { success: true, parentId: parent.parent_id };
          }).catch((err) => {
            console.error("Lỗi tạo notification cho phụ huynh ID:", parent.parent_id, err);
            return { success: false, parentId: parent.parent_id, error: err };
          });
        });
        
        // Chờ tất cả notifications hoàn thành (không block nếu có lỗi)
        const results = await Promise.allSettled(parentNotifications);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        console.log(`Hoàn thành tạo notifications: ${successCount}/${parents.length} phụ huynh thành công`);
      }
      
      console.log("Hoàn thành tạo cảnh cáo học vụ và notifications!");

    } catch (notifyErr) {
      console.error("Lỗi khi tạo notifications:", notifyErr); 
    }

    return NextResponse.json({
      returnCode: 0,
      message: "Academic warning created successfully",
      data: {
        warning,
        notifications: {
          student: studentNotification ? { id: studentNotification.id } : null,
          parents: parents?.length || 0
        },
        summary: {
          studentId: Number(studentId),
          studentName: studentName || "Unknown",
          level: levelStr,
          semesterId: Number(semesterId),
          totalRecipients: 1 + (parents?.length || 0) // student + parents
        }
      },
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
