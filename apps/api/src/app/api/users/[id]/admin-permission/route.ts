import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { canManageAccounts, isSuperAdmin } from "@packages/utils/adminPermissions";
import { AdminPermissionUseCase } from "@packages/core/usecases/AdminPermissionUseCase";
import { AdminType } from "@packages/core/entities/Users";

const useCase = new AdminPermissionUseCase();

/**
 * GET /api/users/[id]/admin-permission
 * Lấy admin_type của một admin user
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { returnCode: -1, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    if (!canManageAccounts(user)) {
      return NextResponse.json(
        { returnCode: -1, message: "You do not have permission to manage accounts!", data: null },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = Number(id);

    const adminType = await useCase.getAdminType(userId);

    return NextResponse.json({
      returnCode: 0,
      message: "OK",
      data: { userId, admin_type: adminType },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Get admin permission error:", err);
    return NextResponse.json(
      { returnCode: -1, message, data: null },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]/admin-permission
 * Cập nhật admin_type cho một admin user
 * Body: { admin_type: "super_admin" | "admin_account" | "admin_academic" | "admin_finance" | null }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { returnCode: -1, message: "Unauthorized", data: null },
        { status: 401 }
      );
    }

    // Chỉ super_admin mới có thể phân quyền cho admin khác
    if (!isSuperAdmin(user)) {
      return NextResponse.json(
        { returnCode: -1, message: "Only super admin can manage admin permissions!", data: null },
        { status: 403 }
      );
    }

    const { id } = await params;
    const userId = Number(id);

    const body = await req.json();
    const { admin_type } = body;

    // Validate admin_type
    const validTypes: (AdminType | null)[] = [
      null,
      "super_admin",
      "admin_account",
      "admin_academic",
      "admin_finance",
      "admin",
    ];

    if (admin_type !== null && admin_type !== undefined && !validTypes.includes(admin_type)) {
      return NextResponse.json(
        {
          returnCode: -1,
          message: `Invalid admin_type. Must be one of: ${validTypes
            .filter(t => t !== null)
            .join(", ")}, or null`,
          data: null,
        },
        { status: 400 }
      );
    }

    // Không cho phép tự thay đổi quyền của chính mình
    if (userId === user.id) {
      return NextResponse.json(
        { returnCode: -1, message: "You cannot change your own permissions!", data: null },
        { status: 400 }
      );
    }

    await useCase.updateAdminType(userId, admin_type || null);

    return NextResponse.json({
      returnCode: 0,
      message: "Admin permission updated successfully",
      data: { userId, admin_type: admin_type || null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Update admin permission error:", err);
    return NextResponse.json(
      { returnCode: -1, message, data: null },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

