import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { supabase } from "@packages/data/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .eq("is_deleted", false);

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch (err: any) {
    console.error("Unread notifications error:", err.message);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
