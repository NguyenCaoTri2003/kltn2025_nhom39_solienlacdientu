import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";
import { handleNotificationError, createSuccessResponse } from "../helpers/error-handler";
import { parsePageParam, parsePageSizeParam, parseUserIdParam } from "../helpers/validation";

/**
 * Lấy danh sách thông báo cho admin
 * Hỗ trợ phân trang và lọc theo userId
 */
export async function GET(req: NextRequest) {
  const start = Date.now();
  
  try {
    // Xác thực quyền admin
    const user = authenticate(req);
    if (user.role !== "admin") {
      throw new Error("Forbidden");
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parsePageParam(searchParams.get("page"));
    const pageSize = parsePageSizeParam(
      searchParams.get("pageSize") || searchParams.get("limit")
    );
    const userId = parseUserIdParam(searchParams.get("userId"));

    // Lấy danh sách thông báo
    const { items, total, totalPages, page: pg, pageSize: ps } = 
      await notificationsUseCase.list({ userId, page, pageSize });
    
    const duration = Date.now() - start;
    const meta = { 
      total, 
      totalPages, 
      page: pg, 
      pageSize: ps, 
      executionTime: `${duration}ms` 
    };
    
    return createSuccessResponse(items, "OK", meta);
    
  } catch (error) {
    return handleNotificationError(error);
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
