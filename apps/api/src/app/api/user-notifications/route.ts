import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";

export async function GET(req: NextRequest) {
  const start = Date.now();
  try {
    const headerToken = req.headers.get("authorization");
    if (!headerToken) {
      return NextResponse.json({ returnCode: -1, message: "No token", data: null }, { status: 401 });
    }
    const user = await authenticate(req);

    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize") || searchParams.get("limit");

    const page = pageParam ? Number(pageParam) : undefined;
    const pageSize = pageSizeParam ? Number(pageSizeParam) : undefined;

    const { items, total, totalPages, page: pg, pageSize: ps } = await notificationsUseCase.getUserNotifications(user.id, { page, pageSize });
    const duration = Date.now() - start;
    
    return NextResponse.json({ 
      returnCode: 0, 
      message: "OK", 
      data: items, 
      meta: { total, totalPages, page: pg, pageSize: ps, executionTime: `${duration}ms` } 
    }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized = message === "No token" || message === "Invalid token" || message === "Token expired";
    const status = isUnauthorized ? 401 : 500;
    return NextResponse.json({ returnCode: -1, message, data: null }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const headerToken = req.headers.get("authorization");
    if (!headerToken) {
      return NextResponse.json({ returnCode: -1, message: "No token", data: null }, { status: 401 });
    }
    await authenticate(req);

    const body = await req.json();
    const { notificationId, action } = body;

    if (!notificationId || !action) {
      return NextResponse.json({ returnCode: -1, message: "Missing notificationId or action", data: null }, { status: 400 });
    }

    if (action === "markAsRead") {
      await notificationsUseCase.markAsRead(notificationId);
    } else if (action === "markAsDeleted") {
      await notificationsUseCase.markAsDeleted(notificationId);
    } else {
      return NextResponse.json({ returnCode: -1, message: "Invalid action", data: null }, { status: 400 });
    }

    return NextResponse.json({ returnCode: 0, message: "Updated", data: null }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized = message === "No token" || message === "Invalid token" || message === "Token expired";
    const status = isUnauthorized ? 401 : 500;
    return NextResponse.json({ returnCode: -1, message, data: null }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const headerToken = req.headers.get("authorization");
    if (!headerToken) {
      return NextResponse.json({ returnCode: -1, message: "No token", data: null }, { status: 401 });
    }
    const user = await authenticate(req);

    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ returnCode: -1, message: "Missing action", data: null }, { status: 400 });
    }

    if (action === "markAllAsRead") {
      await notificationsUseCase.markAllAsRead(user.id);
    } else if (action === "deleteAll") {
      await notificationsUseCase.deleteAll(user.id);
    } else if (action === "create") {
      // Chỉ admin mới được tạo notification
      if (user.role !== "admin") {
        return NextResponse.json(
          { returnCode: -1, message: "Forbidden", data: null },
          { status: 403 }
        );
      }

    const { 
      user_id, 
      title, 
      content, 
      type = "university", 
      category = "GENERAL",
      target_student_id 
    } = body;

      // Validate required fields
      if (!title || !content) {
        return NextResponse.json(
          { returnCode: -1, message: "Title and content are required", data: null },
          { status: 400 }
        );
      }

      // Create notification
      const notification = await notificationsUseCase.create({
        user_id: user_id || null,
        title,
        content,
        type,
        category,
        target_student_id: target_student_id || null
      });

      return NextResponse.json({
        returnCode: 0,
        message: "Notification created successfully",
        data: notification
      }, { status: 201 });
    } else {
      return NextResponse.json({ returnCode: -1, message: "Invalid action", data: null }, { status: 400 });
    }

    return NextResponse.json({ returnCode: 0, message: "Updated", data: null }, { status: 200 });
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
