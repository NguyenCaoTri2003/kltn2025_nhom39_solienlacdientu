import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const body = await req.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { returnCode: -1, message: "Missing notificationId", data: null },
        { status: 400 }
      );
    }

    // Đánh dấu notification đã đọc
    await notificationsUseCase.markAsRead(Number(notificationId));

    return NextResponse.json({
      returnCode: 0,
      message: "Notification marked as read",
      data: null,
    });
  } catch (err: any) {
    console.error("Mark as read error:", err.message);
    return NextResponse.json(
      { returnCode: -1, message: err.message || "Internal server error", data: null },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
