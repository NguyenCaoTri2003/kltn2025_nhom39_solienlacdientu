import { useEffect, useState, useCallback } from "react";
import { messageService } from "../services/messageService";
import { useAuth } from "../context/AuthContext";
import { Conversation, Message } from "@packages/core/entities/Messages";
import { supabase } from "../lib/supabaseClient";

export function useConversations(token?: string, userId?: number) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

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

            if (newMsg.deleted_by?.includes(userId)) {
              const msgs = conv.messages?.map(m =>
                m.id === newMsg.id ? { ...m, ...newMsg } : m
              ) || [];

              // Cập nhật lastMessage mới
              conv.lastMessage = msgs.filter(m => !m.deleted_by?.includes(userId)).slice(-1)[0] || null;
            } else if (newMsg.is_recalled) {
              conv.lastMessage = {
                ...newMsg,
                content: "Tin nhắn đã được thu hồi",
                type: "text",
              }
            } else if (payload.eventType === "INSERT") {
              conv.lastMessage = {
                content: newMsg.content,
                created_at: newMsg.created_at,
                type: newMsg.type || "text",
                sender_id: newMsg.sender_id,
              };

              if (newMsg.sender_id !== userId) {
                conv.unreadCount = (conv.unreadCount ?? 0) + 1;
              }
            }

            updated.splice(idx, 1);
            return [conv, ...updated];
          });
        }
      )
      .subscribe();

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

      // Đánh dấu tất cả đã đọc khi fetch
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
      } catch (err) {
        console.error("Send message failed:", err);
      }
    },
    [token]
  );

  const updateLocalMessage = useCallback(
    (messageId: number, updater: (msg: Message) => Message) => {
      setMessages(prev =>
        prev.map(msg => (msg.id === messageId ? updater(msg) : msg))
      );
    },
    []
  );

  const deleteLocalMessage = useCallback((messageId: number) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  useEffect(() => {
    if (!conversationId || !token || !userId) return;

    const channel = supabase
      .channel(`messages:conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;

          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === newMsg.id);

            if (payload.eventType === "INSERT") {
              if (idx !== -1) return prev;
              return [...prev, newMsg];
            }

            if (payload.eventType === "UPDATE") {
              if (idx === -1) return prev;
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...newMsg };
              return updated;
            }

            return prev;
          });

          // Nếu tin nhắn mới và không phải của mình => đánh dấu đã đọc
          if (payload.eventType === "INSERT" && newMsg.sender_id !== userId) {
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

  return { messages, loading, sendMessage, updateLocalMessage, deleteLocalMessage };
}
