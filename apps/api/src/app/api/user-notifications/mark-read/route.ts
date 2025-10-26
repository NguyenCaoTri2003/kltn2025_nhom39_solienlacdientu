import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    const body = await req.json();
    const { userNotificationId } = body;

    if (!userNotificationId) {
      return NextResponse.json(
        { returnCode: -1, message: "Missing userNotificationId", data: null },
        { status: 400 }
      );
    }

    // Đánh dấu notification đã đọc
    await notificationsUseCase.markAsRead(Number(userNotificationId));

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
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
