import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { UserRepository } from "@packages/data/repositories/UserRepository";

// GET /api/users?page=1&limit=10&search=nguyet
const userRepo = new UserRepository();

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid token", data: null },
        { status: 401 }
      );
    }

    if (user.role !== "admin") {
      return NextResponse.json(
        { returnCode: -1, message: "You do not have access!", data: null },
        { status: 403 }
      );
    }

    // Lấy query params
    const { searchParams } = new URL(req.url);
      const page = Number(searchParams.get("page") || 1);
      const limit = Number(searchParams.get("limit") || 10);
      const search = String(searchParams.get("search") || "");
      const role = searchParams.get("role") || undefined;
      const status = searchParams.get("status") || undefined;

    // Gọi Repository
      const result = await userRepo.getAllUsersWithPagination(page, limit, search, role as any, status as any);

    return NextResponse.json({
      returnCode: 0,
      message: "OK",
      data: {
        users: result.users,
        pagination: { page, limit, total: result.total, totalPages: result.totalPages },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { returnCode: -1, message, data: null },
      { status: 500 }
    );
  }
}