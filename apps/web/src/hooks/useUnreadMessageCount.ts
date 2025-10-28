import { useEffect, useState, useRef } from "react";
import { supabase } from "@packages/data/supabaseClient";

export function useUnreadMessageCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const currentToken = localStorage.getItem("token");
    
    setUserId(currentUser?.id || null);
    setToken(currentToken);
  }, []);

  useEffect(() => {
    if (!userId || !token || initializedRef.current) return;
    
    initializedRef.current = true;

    async function fetchUnread() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    }

    fetchUnread();

    const channel = supabase
      .channel(`messages-unread-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new;

          const { data: conv } = await supabase
            .from("conversations")
            .select("user1_id, user2_id")
            .eq("id", msg.conversation_id)
            .single();

          if (conv && (conv.user1_id === userId || conv.user2_id === userId)) {
            if (msg.sender_id !== userId) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new;

          const { data: conv } = await supabase
            .from("conversations")
            .select("user1_id, user2_id")
            .eq("id", msg.conversation_id)
            .single();

          if (conv && (conv.user1_id === userId || conv.user2_id === userId)) {
            if (msg.sender_id !== userId && msg.is_read) {
              setUnreadCount((prev) => Math.max(prev - 1, 0));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      initializedRef.current = false;
    };
  }, [userId, token]);

  return unreadCount;
}
