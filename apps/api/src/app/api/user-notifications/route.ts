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
    
    const res = NextResponse.json({ 
      returnCode: 0, 
      message: "OK", 
      data: items, 
      meta: { total, totalPages, page: pg, pageSize: ps, executionTime: `${duration}ms` } 
    }, { status: 200 });
    
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized = message === "No token" || message === "Invalid token" || message === "Token expired";
    const status = isUnauthorized ? 401 : 500;
    const res = NextResponse.json({ returnCode: -1, message, data: null }, { status });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  }
}

export async function PUT(req: NextRequest) {
  try {
    const headerToken = req.headers.get("authorization");
    if (!headerToken) {
      return NextResponse.json({ returnCode: -1, message: "No token", data: null }, { status: 401 });
    }
    const user = await authenticate(req);

    const body = await req.json();
    const { userNotificationId, action } = body;

    if (!userNotificationId || !action) {
      return NextResponse.json({ returnCode: -1, message: "Missing userNotificationId or action", data: null }, { status: 400 });
    }

    if (action === "markAsRead") {
      await notificationsUseCase.markAsRead(userNotificationId);
    } else if (action === "markAsDeleted") {
      await notificationsUseCase.markAsDeleted(userNotificationId);
    } else {
      return NextResponse.json({ returnCode: -1, message: "Invalid action", data: null }, { status: 400 });
    }

    const res = NextResponse.json({ returnCode: 0, message: "Updated", data: null }, { status: 200 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized = message === "No token" || message === "Invalid token" || message === "Token expired";
    const status = isUnauthorized ? 401 : 500;
    const res = NextResponse.json({ returnCode: -1, message, data: null }, { status });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
