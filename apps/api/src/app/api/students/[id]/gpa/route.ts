import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { StudentRepository } from "@packages/data/repositories/StudentRepository";

/**
 * GET /api/students/[id]/gpa
 * Trả về GPA gần nhất của sinh viên
 * -> Chỉ admin, lecturer hoặc chính sinh viên đó được phép xem
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Kiểm tra token
    const headerToken = req.headers.get("authorization");
    const cookieToken = req.cookies.get("token")?.value;
    if (!headerToken && !cookieToken) {
      return NextResponse.json(
        { returnCode: -1, message: "No token", data: null },
        { status: 401 }
      );
    }

  const { id: userId, role } = await authenticate(req);
  const { id: studentId } = await ctx.params;

    // 🧩 Nếu không phải admin/lecturer, chỉ cho phép chính sinh viên đó xem GPA
    if (role !== "admin" && role !== "lecturer" && String(userId) !== String(studentId)) {
      return NextResponse.json(
        { returnCode: -1, message: "Unauthorized access", data: null },
        { status: 403 }
      );
    }

    // ✅ Lấy dữ liệu GPA
    const repo = new StudentRepository();
    const gpaData = await repo.getStudentGPAById(studentId);

    if (!gpaData) {
      return NextResponse.json(
        { returnCode: 1, message: "No GPA data found", data: null },
        { status: 404 }
      );
    }

    // ✅ Thành công
    return NextResponse.json(
      { returnCode: 0, message: "OK", data: gpaData },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized =
      message === "No token" || message === "Invalid token" || message === "Token expired";
    const status =
      message === "You do not have access!"
        ? 403
        : isUnauthorized
        ? 401
        : 500;

    return NextResponse.json(
      { returnCode: -1, message, data: null },
      { status }
    );
  }
}
