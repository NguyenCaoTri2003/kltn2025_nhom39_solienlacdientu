import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { canManageAccounts } from "@packages/utils/adminPermissions";
import { UserRepository } from "@packages/data/repositories/UserRepository";

// GET /api/users?page=1&limit=10&search=nguyet
const userRepo = new UserRepository();

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid token", data: null },
        { status: 401 }
      );
    }

    if (!canManageAccounts(user)) {
      return NextResponse.json(
        { returnCode: -1, message: "You do not have permission to manage accounts!", data: null },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    const search = String(searchParams.get("search") || "");
    const role = searchParams.get("role") || undefined;
    const status = searchParams.get("status") || undefined;
    const facultyIdParam = searchParams.get("faculty_id");
    const classIdParam = searchParams.get("class_id");
    const semesterIdParam = searchParams.get("semester_id");
    const facultyId = facultyIdParam ? Number(facultyIdParam) : undefined;
    const classId = classIdParam ? Number(classIdParam) : undefined;
    const semesterId = semesterIdParam ? Number(semesterIdParam) : undefined;

    // Gọi Repository
    const roleParam = (role ?? undefined) as
      | "admin"
      | "lecturer"
      | "student"
      | "parent"
      | undefined;
    const statusParam = (status ?? undefined) as
      | "active"
      | "inactive"
      | "suspended"
      | undefined;

    const result = await userRepo.getAllUsersWithPagination(
      page,
      limit,
      search,
      roleParam,
      statusParam,
      facultyId,
      classId,
      semesterId
    );

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