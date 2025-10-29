import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { supabase } from "@packages/data/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);


    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .or(`conversations.user1_id.eq.${user.id},conversations.user2_id.eq.${user.id}`)
      .neq("sender_id", user.id)
      .eq("is_read", false);

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch (err: any) {
    console.error("Unread messages error:", err.message);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
