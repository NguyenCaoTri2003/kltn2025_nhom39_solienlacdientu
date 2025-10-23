import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";

export async function POST(req: NextRequest) {
  try {
    const user = authenticate(req);
    
    if (user.role !== "admin") {
      return NextResponse.json(
        { returnCode: -1, message: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, content, type = "system", category = "ACADEMIC" } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { returnCode: -1, message: "Missing userId or content" },
        { status: 400 }
      );
    }

    const notification = await notificationsUseCase.create({
      user_id: Number(userId),
      content,
      type,
      category,
    });

    return NextResponse.json({
      returnCode: 0,
      message: "Test notification sent",
      data: notification,
    });
  } catch (error) {
    console.error("Test notification error:", error);
    return NextResponse.json(
      { returnCode: -1, message: "Internal server error" },
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
