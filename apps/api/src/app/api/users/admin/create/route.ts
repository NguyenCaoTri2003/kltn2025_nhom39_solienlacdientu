import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { UserRepository } from "@packages/data/repositories/UserRepository";
import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";

const userRepo = new UserRepository();

/**
 * POST /api/users/admin/create
 * Yêu cầu quyền admin
 * Body:
 * {
 *   user: { full_name, role, email, phone, ... },
 *   student?: { student_code, class_id, ... },
 *   parents?: [
 *     {
 *       user: { full_name, email, phone, ... },
 *       parent: { occupation },
 *       relationship: "father" | "mother" | "guardian"
 *     }
 *   ],
 *   parent?: { occupation },
 *   student_parent?: { student_id, relationship },
 *   lecturer?: { lecturer_code, faculty_id, ... }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await authenticate(req);
    if (!authUser || authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Bạn không có quyền thực hiện hành động này." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { user, student, parents, parent, lecturer, student_parent } = body;

    if (!user?.full_name || !user?.role) {
      return NextResponse.json(
        { error: "Thiếu thông tin user hoặc role." },
        { status: 400 }
      );
    }

    // ⚙️ Kiểm tra logic theo role
    if (user.role === "parent" && !parent) {
      return NextResponse.json(
        { error: "Thiếu thông tin parent khi tạo phụ huynh." },
        { status: 400 }
      );
    }

    if (user.role === "parent" && !student_parent) {
      return NextResponse.json(
        { error: "Phụ huynh phải được liên kết với ít nhất một học sinh (student_parent)." },
        { status: 400 }
      );
    }

    if (user.role === "student" && parents && !Array.isArray(parents)) {
      return NextResponse.json(
        { error: "parents phải là một mảng." },
        { status: 400 }
      );
    }

    // 🧠 Gọi repository để tạo tài khoản
    const result = await userRepo.createUserWithRole({
      user,
      student,
      parents,
      parent,
      lecturer,
      student_parent,
    });

    // Ép kiểu mảng user được trả về
    const createdUsers = Array.isArray(result)
      ? (result as { id: number; role: string }[])
      : [{ id: (result as any).id, role: (result as any).role }];

    // 🪵 Ghi log (lấy id user đầu tiên)
    try {
      await logUserChange({
        user_id: createdUsers[0]?.id ?? null,
        changed_by: authUser.id,
        change_type: "create_user",
        changes: {
          created_at: new Date().toISOString(),
          description: `Admin ${authUser.id} đã tạo người dùng mới với role '${user.role}'`,
        },
      });
    } catch (logErr) {
      console.warn("⚠️ Ghi log thất bại:", logErr);
    }

    // ✅ Trả về kết quả thống nhất
    return NextResponse.json(
      {
        message: "Tạo tài khoản thành công!",
        users: createdUsers.map((u) => ({
          id: u.id,
          role: u.role,
        })),
      },
      { status: 201 }
    );
  } catch (e: unknown) {
    console.error("❌ Lỗi hệ thống:", e);
    const err = e as { status?: number; message?: string; code?: string; field?: string };
    const status = typeof err?.status === "number" ? err.status : 500;

    return NextResponse.json(
      {
        error: err?.message ?? "Lỗi hệ thống.",
        code: err?.code || (status === 409 ? "DUPLICATE" : "UNKNOWN"),
        field: err?.field,
      },
      { status }
    );
  }
}
