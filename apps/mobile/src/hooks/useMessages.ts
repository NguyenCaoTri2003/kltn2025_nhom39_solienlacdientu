import { useEffect, useState, useCallback } from "react";
import { messageService } from "../services/messageService";
import { useAuth } from "../context/AuthContext";
import { Conversation, Message } from "@packages/core/entities/Messages";
import { supabase } from "../lib/supabaseClient";

export function useConversations(token?: string, userId?: number) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch lần đầu
    const fetchConversations = useCallback(async () => {
        if (!token || !userId) return;
        setLoading(true);
        try {
            const data = await messageService.getConversations(token);
            setConversations(data);
        } finally {
            setLoading(false);
        }
    }, [token, userId]);

    // Realtime cập nhật lastMessage + unreadCount
    useEffect(() => {
        if (!token || !userId) return;

        const channel = supabase
            .channel(`messages:realtime-list-${userId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                (payload) => {
                    const newMsg = payload.new as Message;

                    setConversations((prev) => {
                        const idx = prev.findIndex((c) => c.id === newMsg.conversation_id);
                        if (idx === -1) return prev;

                        const updated = [...prev];
                        const conv = { ...updated[idx] };

                        conv.lastMessage = {
                            content: newMsg.content,
                            created_at: newMsg.created_at,
                        };

                        // Nếu tin nhắn không phải của mình => tăng unread
                        if (newMsg.sender_id !== userId) {
                            conv.unreadCount = (conv.unreadCount ?? 0) + 1;
                        }

                        // Đưa cuộc hội thoại đó lên đầu
                        updated.splice(idx, 1);
                        return [conv, ...updated];
                    });
                }
            )
            .subscribe();

        // ✅ Cleanup đồng bộ, không trả Promise
        return () => {
            supabase.removeChannel(channel);
        };
    }, [token, userId]);


    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    return { conversations, setConversations, loading, refresh: fetchConversations };
}

export function useMessages(
  conversationId: number,
  userId: number,
  token?: string,
  onReadAll?: () => void
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await messageService.getMessages(conversationId, token);
      setMessages(data);
      await messageService.markAsRead(conversationId, token);
      onReadAll?.();
    } finally {
      setLoading(false);
    }
  }, [conversationId, token, onReadAll]);

  const sendMessage = useCallback(
    async (
      receiverId: number,
      content: string,
      type: "text" | "image" | "file" = "text",
      fileUri?: string,
      fileName?: string
    ) => {
      if (!token) return;
      try {
        const newMsg = await messageService.sendMessage(
          receiverId,
          content,
          token,
          type,
          fileUri,
          fileName
        );
        // setMessages((prev) => [...prev, newMsg]);
      } catch (err) {
        console.error("Send message failed:", err);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!conversationId || !token || !userId) return;

    const channel = supabase
      .channel(`messages:conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (newMsg.sender_id !== userId) {
            try {
              await messageService.markAsRead(conversationId, token);
              onReadAll?.();
            } catch (err) {
              console.warn("Mark as read failed:", err);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, token, userId, onReadAll]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, loading, sendMessage };
}