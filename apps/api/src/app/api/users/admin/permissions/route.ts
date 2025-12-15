import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { canManageAccounts } from "@packages/utils/adminPermissions";
import { AdminPermissionUseCase } from "@packages/core/usecases/AdminPermissionUseCase";
import { AdminType } from "@packages/core/entities/Users";

const useCase = new AdminPermissionUseCase();

/**
 * GET /api/users/admin/permissions
 * Lấy danh sách admin với admin_type, hỗ trợ search và pagination
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const adminTypeParam = searchParams.get("adminType") || "all";
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 20;

    const adminType: AdminType | "all" = 
      adminTypeParam === "all" ? "all" : (adminTypeParam as AdminType);

    const result = await useCase.getAllAdminsWithTypes({
      search,
      adminType,
      page,
      pageSize,
    });

    return NextResponse.json({
      returnCode: 0,
      message: "OK",
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Get all admin permissions error:", err);
    return NextResponse.json(
      { returnCode: -1, message, data: null },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

