import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { canManageAcademic } from "@packages/utils/adminPermissions";
import { supabase } from "@packages/data/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json(
        { returnCode: -1, message: "Invalid or missing token", data: null },
        { status: 401 }
      );
    }

    if (!canManageAcademic(user)) {
      return NextResponse.json(
        { returnCode: -1, message: "You do not have permission to manage academic affairs!", data: null },
        { status: 403 }
      );
    }

    // Lấy số cảnh cáo theo level từ bảng academic_warnings
    const { data, error } = await supabase
      .from("academic_warnings")
      .select("level");

    if (error) throw error;

    // Đếm số cảnh cáo theo từng level
    const levelMap = new Map<string, number>();
    (data || []).forEach((warning: any) => {
      const level = warning.level || "UNKNOWN";
      levelMap.set(level, (levelMap.get(level) || 0) + 1);
    });

    // Chuyển đổi thành array
    const result = Array.from(levelMap.entries()).map(([level, count]) => ({
      level,
      count
    }));

    return NextResponse.json({
      returnCode: 0,
      message: "OK",
      data: result,
    });
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

