import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@packages/data/repositories/UserRepository";
import { AuthUseCase } from "@packages/core/usecases/authUseCase";
import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";

const userRepo = new UserRepository();
const authUseCase = new AuthUseCase(userRepo);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password, role } = body;

    if (!role || !["student", "parent"].includes(role)) {
      return NextResponse.json(
        { error: "Vai trò không hợp lệ" },
        { status: 400 }
      );
    }

    const { user, token } = await authUseCase.loginStudentOrParent(identifier, password, role);

    const status = String(user.status || "").toLowerCase();
    if (status === "inactive") {
      return NextResponse.json(
        { error: "Tài khoản của bạn đang bị khóa. Vui lòng liên hệ quản trị viên." },
        { status: 403 }
      );
    }

    if (status === "suspended") {
      const oldStatus = user.status;
      const updatedUser = await userRepo.updateUserStatus(user.id, "active");

      await logUserChange({
        user_id: user.id,
        changed_by: null,
        change_type: "status_change",
        changes: {
          old_status: oldStatus,
          new_status: "active",
          reason: "First-time login",
          changed_at: new Date().toISOString(),
          source: "system",
        },
      });

      user.status = updatedUser.status;
    }

    const res = NextResponse.json({ user, token }, { status: 200 });

    // Lưu cookie
    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });
    res.cookies.set("user", JSON.stringify(user), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
