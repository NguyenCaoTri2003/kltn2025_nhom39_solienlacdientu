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
  // userId param is ignored for non-admin route

    // Split behavior: non-admin can only view their own; admin should call /api/notifications/admin
    if (user.role === "admin") {
      const res = NextResponse.json({ returnCode: -1, message: "Admins: use /api/notifications/admin for listing.", data: null }, { status: 400 });
      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res;
    }

    const effectiveUserId = user.id;
    const { items, total, totalPages, page: pg, pageSize: ps } = await notificationsUseCase.getUserNotifications(effectiveUserId, { page, pageSize });
    const duration = Date.now() - start;
    const res = NextResponse.json({ returnCode: 0, message: "OK", data: items, meta: { total, totalPages, page: pg, pageSize: ps, executionTime: `${duration}ms` } }, { status: 200 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized = message === "No token" || message === "Invalid token" || message === "Token expired";
    const status = isUnauthorized ? 401 : 500;
    const res = NextResponse.json({ returnCode: -1, message, data: null }, { status });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  }
}

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

    const body = await req.json().catch(() => ({}));
    const allowedTypes = new Set(["university", "lecturer", "system"]);
    const requestedType = body?.type ?? null;
    if (requestedType != null && !allowedTypes.has(String(requestedType))) {
      const res = NextResponse.json({ returnCode: -1, message: "Invalid notification type", data: null }, { status: 400 });
      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      return res;
    }
    const payload = {
      user_id: body?.user_id ?? null,
      content: typeof body?.content === "string" ? body.content : null,
      type: requestedType,
      category: body?.category ?? null,
    };
    const created = await notificationsUseCase.create(payload);
    const res = NextResponse.json({ returnCode: 0, message: "Created", data: created }, { status: 201 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized = message === "No token" || message === "Invalid token" || message === "Token expired";
    const status = isUnauthorized ? 401 : 500;
    const res = NextResponse.json({ returnCode: -1, message, data: null }, { status });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
