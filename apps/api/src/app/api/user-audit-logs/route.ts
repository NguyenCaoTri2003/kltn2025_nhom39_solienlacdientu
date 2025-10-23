import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { UserAuditLogRepository } from "@packages/data/repositories/UserAuditLogRepository";
import { ChangeType } from "@packages/core/entities/UserAuditLog";

const repo = new UserAuditLogRepository();

// GET /api/user-audit-logs?user_id=123&page=1&limit=10
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    if (!auth) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid token", data: null },
        { status: 401 }
      );
    }
    if (auth.role !== "admin") {
      return NextResponse.json(
        { returnCode: -1, message: "You do not have access!", data: null },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get("user_id"));
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 10);
    if (!Number.isFinite(userId)) {
      return NextResponse.json(
        { returnCode: -1, message: "Missing or invalid user_id", data: null },
        { status: 400 }
      );
    }

    const result = await repo.listByUser(userId, page, limit);
    return NextResponse.json({
      returnCode: 0,
      message: "OK",
      data: {
        logs: result.logs,
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

// POST /api/user-audit-logs
// Body: { user_id: number; changed_by?: number|null; change_type: ChangeType; changes: Record<string,any> }
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    if (!auth) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid token", data: null },
        { status: 401 }
      );
    }
    if (auth.role !== "admin") {
      return NextResponse.json(
        { returnCode: -1, message: "You do not have access!", data: null },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid JSON body", data: null },
        { status: 400 }
      );
    }
    const { user_id, changed_by = auth.id ?? null, change_type, changes } = body as {
      user_id?: number;
      changed_by?: number | null;
      change_type?: ChangeType;
  changes?: Record<string, unknown>;
    };

    if (!user_id || !change_type || !changes) {
      return NextResponse.json(
        { returnCode: -1, message: "Missing required fields", data: null },
        { status: 400 }
      );
    }

    const created = await repo.createLog({
      user_id,
      changed_by,
      change_type,
      changes,
    });

    return NextResponse.json({ returnCode: 0, message: "Created", data: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { returnCode: -1, message, data: null },
      { status: 500 }
    );
  }
}
