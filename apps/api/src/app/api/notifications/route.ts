import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";

export async function POST(req: NextRequest) {
  try {
    const headerToken = req.headers.get("authorization");
    if (!headerToken) {
      return NextResponse.json({ returnCode: -1, message: "No token", data: null }, { status: 401 });
    }

    const user = await authenticate(req);
    if (user.role !== "admin") {
      return NextResponse.json({ returnCode: -1, message: "Forbidden", data: null }, { status: 403 });
    }

    const body = await req.json();
    const { mode, title, content, type = "university", category = "GENERAL" } = body || {};

    if (!title && !content) {
      return NextResponse.json({ returnCode: -1, message: "Title or content is required", data: null }, { status: 400 });
    }

    if (mode === "broadcast") {
      const result = await notificationsUseCase.createForAll({ title, content, type, category });
      return NextResponse.json({ returnCode: 0, message: "Broadcast created", data: { created: result.created } }, { status: 201 });
    }

    const notification = await notificationsUseCase.create({
      user_id: body?.user_id ?? null,
      title,
      content,
      type,
      category,
      target_student_id: body?.target_student_id ?? null,
    });
    return NextResponse.json({ returnCode: 0, message: "Notification created", data: notification }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized = message === "No token" || message === "Invalid token" || message === "Token expired";
    const status = isUnauthorized ? 401 : 500;
    return NextResponse.json({ returnCode: -1, message, data: null }, { status });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}


