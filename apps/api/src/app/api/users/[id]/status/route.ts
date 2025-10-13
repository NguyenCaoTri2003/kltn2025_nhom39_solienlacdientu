import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@packages/data/repositories/UserRepository";
import { authenticate } from "@packages/utils/auth";
import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase"; 

const repo = new UserRepository();

/**
 *  API: Cập nhật trạng thái người dùng
 * PATCH http://localhost:3000/api/users/:id/status
 * Body: { status: "active" | "inactive" | "suspended" }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userPayload = authenticate(req);
    if (!userPayload) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid or missing token", data: null },
        { status: 401 }
      );
    }

    const { id } = params;
    const targetId = Number(id);

    if (userPayload.role !== "admin" && userPayload.id !== null) {
      return NextResponse.json(
        { returnCode: -1, message: "Permission denied: Admin only", data: null },
        { status: 403 }
      ); 
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !["active", "inactive", "suspended"].includes(status)) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid or missing status field", data: null },
        { status: 400 }
      );
    }

    // Lấy user trước khi thay đổi (để ghi log so sánh)
    const oldUser = await repo.findById(targetId);

    // Cập nhật trong DB
    const updatedUser = await repo.updateUserStatus(targetId, status);

    // Ghi log hoạt động
    try {
      await logUserChange({
        user_id: targetId,
        changed_by: userPayload.id,
        change_type: "status_change",
        changes: {
          old_status: oldUser.status,
          new_status: updatedUser.status,
          changed_at: new Date().toISOString(),
        },
      });
    } catch (logErr) {
      console.warn("⚠️ Failed to write user audit log:", logErr);
    }

    // Trả về response thành công
    return NextResponse.json(
      {
        returnCode: 0,
        message: "Cập nhật trạng thái thành công",
        data: {
          id: updatedUser.id,
          full_name: updatedUser.full_name,
          status: updatedUser.status,
          role: updatedUser.role,
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("❌ Error updating user status:", e);
    return NextResponse.json(
      {
        returnCode: -1,
        message: e.message || "Internal Server Error",
        data: null,
      },
      { status: e.message === "Invalid token" ? 401 : 500 }
    );
  }
}
