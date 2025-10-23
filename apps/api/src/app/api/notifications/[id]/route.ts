import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";
import { handleNotificationError, createSuccessResponse } from "../helpers/error-handler";

/**
 * Xóa thông báo theo ID
 * Chỉ admin mới có quyền xóa
 */
export async function DELETE(
  _req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Kiểm tra ID có tồn tại
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { returnCode: -1, message: "Missing id", data: null }, 
        { status: 400 }
      );
    }

    // Xác thực quyền admin
    const user = authenticate(_req);
    if (user.role !== "admin") {
      throw new Error("Forbidden");
    }

    // Xóa thông báo
    await notificationsUseCase.delete(id);
    
    return createSuccessResponse(null, "Deleted", undefined, "DELETE,OPTIONS");
    
  } catch (error) {
    return handleNotificationError(error, "DELETE,OPTIONS");
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
