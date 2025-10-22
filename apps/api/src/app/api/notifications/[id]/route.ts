import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ returnCode: -1, message: "Missing id", data: null }, { status: 400 });
    }

    const user = authenticate(_req);
    if (user.role !== "admin") {
      return NextResponse.json({ returnCode: -1, message: "Forbidden", data: null }, { status: 403 });
    }

    await notificationsUseCase.delete(id);
    const res = NextResponse.json({ returnCode: 0, message: "Deleted", data: null }, { status: 200 });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized = message === "No token" || message === "Invalid token" || message === "Token expired";
    const status = isUnauthorized ? 401 : 500;
    const res = NextResponse.json({ returnCode: -1, message, data: null }, { status });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "DELETE,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
