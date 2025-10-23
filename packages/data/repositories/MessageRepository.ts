import { supabase } from "../supabaseClient";

export class MessageRepository {
  async getOrCreateConversation(userA: number, userB: number) {
    const user1_id = Math.min(userA, userB);
    const user2_id = Math.max(userA, userB);

    const { data: existing, error } = await supabase
      .from("conversations")
      .select("id")
      .eq("user1_id", user1_id)
      .eq("user2_id", user2_id)
      .maybeSingle();

    if (error) throw error;
    if (existing) return existing.id;

    const { data: created, error: insertError } = await supabase
      .from("conversations")
      .insert([{ user1_id, user2_id }])
      .select("id")
      .single();

    if (insertError) throw insertError;
    return created.id;
  }

  async sendMessage(
    conversationId: number,
    senderId: number,
    content: string,
    type: "text" | "image" | "file" | "system" = "text",
    channel: string | null = null
  ) {
    const { data, error } = await supabase
      .from("messages")
      .insert([{ conversation_id: conversationId, sender_id: senderId, content, type, channel }])
      .select("*, sender:users(id, full_name, role)")
      .single();

    if (error) throw error;
    return data;
  }

  // async getMessages(conversationId: number) {
  //   const { data, error } = await supabase
  //     .from("messages")
  //     .select("*, sender:users(id, full_name, role, avatar_url)")
  //     .eq("conversation_id", conversationId)
  //     .order("created_at", { ascending: true });

  //   if (error) throw error;
  //   return data;
  // }

  async getMessages(conversationId: number) {
    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:users(id, full_name, role, avatar_url)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data.map(msg => ({
      ...msg,
      status: msg.is_read ? "read" : "sent",
    }));
  }

  // async listConversations(userId: number) {
  //   const { data, error } = await supabase
  //     .from("conversations")
  //     .select(`
  //       id,
  //       user1:users!user1_id(id, full_name, role, avatar_url),
  //       user2:users!user2_id(id, full_name, role, avatar_url),
  //       messages(id, content, created_at, sender_id, type)
  //     `)
  //     .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
  //     .order("updated_at", { ascending: false });

  //   if (error) throw error;

  //   return data.map((c) => ({
  //     ...c,
  //     lastMessage: c.messages?.[c.messages.length - 1] || null,
  //   }));
  // }

  async listConversations(userId: number) {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
      id,
      user1:users!user1_id(id, full_name, role, avatar_url),
      user2:users!user2_id(id, full_name, role, avatar_url),
      messages(id, content, created_at, sender_id, type),
      messages_unread:messages(count)
    `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const conversationsWithUnread = await Promise.all(
      data.map(async (c) => {
        const { count, error: countError } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("sender_id", userId)
          .eq("is_read", false);

        if (countError) throw countError;

        return {
          ...c,
          lastMessage: c.messages?.[c.messages.length - 1] || null,
          unreadCount: count || 0,
          isUnread: (count || 0) > 0,
        };
      })
    );

    return conversationsWithUnread;
  }

  async getConversationById(conversationId: number) {
    const { data, error } = await supabase
      .from("conversations")
      .select("id, user1_id, user2_id")
      .eq("id", conversationId)
      .single();

    if (error) throw error;
    return data;
  }

  async markMessagesAsRead(conversationId: number, userId: number) {
    const { data, error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("is_read", false);

    if (error) throw error;
    return data;
  }
}
