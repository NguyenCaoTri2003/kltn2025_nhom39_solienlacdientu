import { supabase } from "../supabaseClient";

export class MessageRepository {
  async createMessage(record: {
    sender_id: number;
    receiver_id: number | null;
    content: string;
    channel?: string;
  }) {
    const { data, error } = await supabase
      .from("messages")
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getConversation(userId: number, otherUserId: number) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  }

  async getInbox(userId: number) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }
}
