import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { authenticate } from "@packages/utils/auth";
import { UserRepository } from "@packages/data/repositories/UserRepository";
import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase";
import { isValidPassword } from "@packages/utils/Regex";

const userRepo = new UserRepository();

/**
 * POST /api/auth/admin/reset-password
 * {
 *   "userId": 123,
 *   "newPassword": "12345678"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { id: adminId, role } = authenticate(req); 

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, newPassword } = body as {
      userId?: number;
      newPassword?: string;
    };

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const user = await userRepo.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User does not exist" }, { status: 404 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await userRepo.updateUser(userId, { password_hash: newHash });

    try {
      await logUserChange({
        user_id: userId,
        changed_by: adminId,
        change_type: "reset_password",
        changes: {
          changed_at: new Date().toISOString(),
          description: `Admin reset password for userID: ${userId}`,
        },
      });
    } catch (logErr) {
      console.warn("⚠️ Failed to log reset password:", logErr);
    }

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "System error" }, { status: 400 });
  }
}

