import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { supabase } from "@packages/data/supabaseClient";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);

    const { data: conversations, error: convError } = await supabase
      .from("conversations")
      .select("id")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (convError) throw convError;

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const conversationIds = conversations.map((c) => c.id);

    const { count, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .in("conversation_id", conversationIds)
      .neq("sender_id", user.id)
      .eq("is_read", false);

    if (error) throw error;

    return NextResponse.json({ count: count || 0 });
  } catch (err: any) {
    console.error("Unread messages error:", err.message);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
