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

  async getMessages(conversationId: number) {
    const { data, error } = await supabase
      .from("messages")
      .select("*, sender:users(id, full_name, role, avatar_url)")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    console.log("Fetched messages:", data);
    return data.map(msg => ({
      ...msg,
      status: msg.is_read ? "read" : "sent",
    }));
  }

  // async listConversations(userId: number) {
  //   const { data, error } = await supabase
  //     .from("conversations")
  //     .select(`
  //     id,
  //     user1:users!user1_id(id, full_name, role, avatar_url),
  //     user2:users!user2_id(id, full_name, role, avatar_url),
  //     messages(id, content, created_at, sender_id, type, is_read),
  //     messages_unread:messages(count)
  //   `)
  //     .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
  //     .order("updated_at", { ascending: false });

  //   if (error) throw error;

  //   const conversationsWithUnread = await Promise.all(
  //     data.map(async (c) => {
  //       const { data: lastMsgs } = await supabase
  //         .from("messages")
  //         .select("id, content, created_at, sender_id, type, is_read, is_recalled, deleted_by")
  //         .eq("conversation_id", c.id)
  //         .order("created_at", { ascending: false })
  //         .limit(1);

  //       const lastMessage = lastMsgs?.[0] || null;

  //       const { count } = await supabase
  //         .from("messages")
  //         .select("id", { count: "exact", head: true })
  //         .eq("conversation_id", c.id)
  //         .neq("sender_id", userId)
  //         .eq("is_read", false);

  //       return {
  //         ...c,
  //         lastMessage,
  //         unreadCount: count || 0,
  //         isUnread: (count || 0) > 0,
  //       };
  //     })
  //   );

  //   return conversationsWithUnread;
  // }

  async listConversations(userId: number) {
    // Lấy danh sách conversation của user
    const { data: convs, error } = await supabase
      .from("conversations")
      .select(`
      id,
      user1:users!user1_id(id, full_name, role, avatar_url),
      user2:users!user2_id(id, full_name, role, avatar_url)
    `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const conversationsWithUnread = await Promise.all(
      convs.map(async (c) => {
        // Lấy nhiều tin nhắn gần nhất mà user chưa xóa
        const { data: msgs } = await supabase
          .from("messages")
          .select("id, content, created_at, sender_id, type, is_read, is_recalled, deleted_by")
          .eq("conversation_id", c.id)
          .not("deleted_by", "cs", `{${userId}}`) // deleted_by không chứa userId
          .order("created_at", { ascending: false })
          .limit(1); // chỉ lấy 1 tin nhắn gần nhất hợp lệ

        const lastMessage = msgs?.[0] || null;

        // Đếm số tin nhắn chưa đọc
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .neq("sender_id", userId)
          .eq("is_read", false);

        return {
          ...c,
          lastMessage,
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

  async getConversationWith(userA: number, userB: number) {
    const user1_id = Math.min(userA, userB);
    const user2_id = Math.max(userA, userB);

    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        user1:users!user1_id(id, full_name, role, avatar_url),
        user2:users!user2_id(id, full_name, role, avatar_url),
        messages(id, content, created_at, sender_id, type, is_read)
      `)
      .eq("user1_id", user1_id)
      .eq("user2_id", user2_id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async recallMessage(messageId: number, userId: number) {
    // Lấy message
    const { data: msg, error: fetchErr } = await supabase
      .from("messages")
      .select("id, sender_id")
      .eq("id", messageId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!msg) throw new Error("Message not found");

    if (msg.sender_id !== userId) {
      throw new Error("Forbidden: cannot recall other's message");
    }

    // Không sửa content nữa
    const { data, error } = await supabase
      .from("messages")
      .update({
        is_recalled: true,
      })
      .eq("id", messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteMessage(messageId: number, userId: number) {
    // Lấy message
    const { data: msg, error: fetchErr } = await supabase
      .from("messages")
      .select("id, deleted_by")
      .eq("id", messageId)
      .single();

    if (fetchErr) throw fetchErr;
    if (!msg) throw new Error("Message not found");

    // Cập nhật deleted_by: thêm userId nếu chưa có
    const newDeletedBy = msg.deleted_by ? [...msg.deleted_by, userId] : [userId];

    const { data, error } = await supabase
      .from("messages")
      .update({
        deleted_by: newDeletedBy,
      })
      .eq("id", messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

