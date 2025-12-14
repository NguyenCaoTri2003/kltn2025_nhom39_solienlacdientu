import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { canManageAcademic, isAdmin } from "@packages/utils/adminPermissions";
import { academicWarningV3UseCase } from "@packages/core/usecases/AcademicWarningV3UseCase";
import { UserRepository } from "@packages/data/repositories/UserRepository";


export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const headerToken = req.headers.get("authorization");
    const cookieToken = req.cookies.get("token")?.value;
    if (!headerToken && !cookieToken) {
      return NextResponse.json(
        { returnCode: -1, message: "No token", data: null },
        { status: 401 }
      );
    }

    const user = await authenticate(req);
    const { id } = await ctx.params;
    const studentId = Number(id);

    // Student có thể xem cảnh cáo của chính mình
    if (user.id === studentId) {
      // Cho phép
    }
    // Lecturer có thể xem
    else if (user.role === "lecturer") {
      // Cho phép
    }
    // Admin phải có quyền quản lý học vụ
    else if (isAdmin(user)) {
      if (!canManageAcademic(user)) {
        return NextResponse.json(
          { returnCode: -1, message: "You do not have permission to manage academic affairs!", data: null },
          { status: 403 }
        );
      }
    }
    // Các role khác không được phép
    else {
      return NextResponse.json(
        { returnCode: -1, message: "Unauthorized access", data: null },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
  const semesterIdParam = searchParams.get("semesterId");
  const semesterId = semesterIdParam ? Number(semesterIdParam) : undefined;

  // Optional filters: level, from (ISO), to (ISO)
  const levelFilter = (searchParams.get("level") || "").trim().toLowerCase();
  const fromFilter = searchParams.get("from");
  const toFilter = searchParams.get("to");

  const result = await academicWarningV3UseCase.getStudentWarnings(studentId, semesterId);

    // Apply optional filters on the warnings list
    let warnings = result.warnings || [];
    if (levelFilter) {
      warnings = warnings.filter((w) => String(w.level || "").toLowerCase() === levelFilter);
    }
    if (fromFilter) {
      const from = new Date(fromFilter);
      if (!Number.isNaN(from.getTime())) {
        warnings = warnings.filter((w) => new Date(w.warned_at) >= from);
      }
    }
    if (toFilter) {
      const to = new Date(toFilter);
      if (!Number.isNaN(to.getTime())) {
        warnings = warnings.filter((w) => new Date(w.warned_at) <= to);
      }
    }

    // Lấy thông tin student để hiển thị full_name
    const userRepo = new UserRepository();
    const studentInfo = await userRepo.findById(studentId);

    const data = {
      student_id: result.student_id,
      student_code: studentInfo?.student?.student_code || null,
      full_name: studentInfo?.full_name || null,
      semester_id: result.semester_id,
      total_warning: warnings.length, // reflect filtered count if filters applied
      warnings,
    };

    return NextResponse.json({ returnCode: 0, message: "OK", data }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized = message === "No token" || message === "Invalid token" || message === "Token expired";
    const status = isUnauthorized ? 401 : 500;
    return NextResponse.json({ returnCode: -1, message, data: null }, { status });
  }
}
