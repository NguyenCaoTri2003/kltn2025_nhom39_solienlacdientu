import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@packages/data/repositories/UserRepository";
import { authenticate } from "@packages/utils/auth";
import { logUserChange } from "@packages/core/usecases/UserAuditLogUseCase"; 
import { sendEmail } from "../../../../email/mailer";
import { renderTemplate } from "../../../../email/templates";

const STATUS_LABEL_VI: Record<string, string> = {
  active: 'Đang hoạt động',
  inactive: 'Đã khóa',
  suspended: 'Chờ kích hoạt'
};

const repo = new UserRepository();

/**
 *  API: Cập nhật trạng thái người dùng
 * PATCH http://localhost:3000/api/users/:id/status
 * Body: { status: "active" | "inactive" | "suspended" }
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = 'then' in context.params ? await context.params : context.params;
    const { id } = resolvedParams;
    const userPayload = await authenticate(req);
    if (!userPayload) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid or missing token", data: null },
        { status: 401 }
      );
    }

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


    const oldUser = await repo.findById(targetId);

    const updatedUser = await repo.updateUserStatus(targetId, status);

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
      console.warn("Failed to write user audit log:", logErr);
    }


    ;(async () => {
      try {
        interface BasicUser { email?: string; full_name?: string }
        const targetUser = updatedUser as BasicUser;
        if (targetUser.email) {
          const tpl = renderTemplate('account_status_changed', {
            fullName: targetUser.full_name || 'Người dùng',
            newStatus: STATUS_LABEL_VI[updatedUser.status] || updatedUser.status,
          });
          await sendEmail({
            to: targetUser.email,
            subject: tpl.subject,
            html: tpl.html,
            text: tpl.text,
          });
        }
      } catch (mailErr) {
        console.warn('[user-status] Failed to send status change email (non-blocking):', mailErr);
      }
    })();


    return NextResponse.json(
      {
        returnCode: 0,
        message: "Cập nhật trạng thái thành công",
        data: {
          id: updatedUser.id,
          full_name: updatedUser.full_name,
          status: updatedUser.status, 
          status_label: STATUS_LABEL_VI[updatedUser.status] || updatedUser.status,
          role: updatedUser.role,
        },
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    console.error("Error updating user status:", e);
    return NextResponse.json(
      {
        returnCode: -1,
        message: e instanceof Error ? e.message : "Internal Server Error",
        data: null,
      },
      { status: e instanceof Error && e.message === "Invalid token" ? 401 : 500 }
    );
  }
}
