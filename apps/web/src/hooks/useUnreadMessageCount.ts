// import { useEffect, useState, useRef } from "react";
// import { supabase } from "@packages/data/supabaseClient";

// export function useUnreadMessageCount() {
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [userId, setUserId] = useState<number | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const initializedRef = useRef(false);

//   useEffect(() => {
//     if (typeof window === "undefined") return;
    
//     const currentUser = JSON.parse(localStorage.getItem("user") || "null");
//     const currentToken = localStorage.getItem("token");
    
//     setUserId(currentUser?.id || null);
//     setToken(currentToken);
//   }, []);

//   useEffect(() => {
//     if (!userId || !token || initializedRef.current) return;
    
//     initializedRef.current = true;

//     async function fetchUnread() {
//       try {
//         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/unread-count`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (res.ok) {
//           const data = await res.json();
//           setUnreadCount(data.count || 0);
//         }
//       } catch (error) {
//         console.error("Error fetching unread count:", error);
//       }
//     }

//     fetchUnread();

//     const channel = supabase
//       .channel(`messages-unread-${userId}`)
//       .on(
//         "postgres_changes",
//         { event: "INSERT", schema: "public", table: "messages" },
//         async (payload) => {
//           const msg = payload.new;

//           const { data: conv } = await supabase
//             .from("conversations")
//             .select("user1_id, user2_id")
//             .eq("id", msg.conversation_id)
//             .single();

//           if (conv && (conv.user1_id === userId || conv.user2_id === userId)) {
//             if (msg.sender_id !== userId) {
//               setUnreadCount((prev) => prev + 1);
//             }
//           }
//         }
//       )
//       .on(
//         "postgres_changes",
//         { event: "UPDATE", schema: "public", table: "messages" },
//         async (payload) => {
//           const msg = payload.new;

//           const { data: conv } = await supabase
//             .from("conversations")
//             .select("user1_id, user2_id")
//             .eq("id", msg.conversation_id)
//             .single();

//           if (conv && (conv.user1_id === userId || conv.user2_id === userId)) {
//             if (msg.sender_id !== userId && msg.is_read) {
//               setUnreadCount((prev) => Math.max(prev - 1, 0));
//             }
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//       initializedRef.current = false;
//     };
//   }, [userId, token]);

//   return unreadCount;
// }
import { useEffect, useState, useRef } from "react";
import { supabase } from "@packages/data/supabaseClient";

export function useUnreadMessageCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      console.log("[useUnreadMessageCount] Skipped (not client)");
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const currentToken = localStorage.getItem("token");

      console.log("[useUnreadMessageCount] User:", currentUser);
      console.log("[useUnreadMessageCount] Token:", !!currentToken ? "found" : "missing");

      setUserId(currentUser?.id || null);
      setToken(currentToken);
    } catch (err) {
      console.error("[useUnreadMessageCount] Error reading localStorage:", err);
    }
  }, []);

  useEffect(() => {
    if (!userId || !token) {
      console.log("[useUnreadMessageCount] Missing userId/token => skip init", { userId, token });
      return;
    }
    if (initializedRef.current) {
      console.log("[useUnreadMessageCount] Already initialized, skipping...");
      return;
    }

    initializedRef.current = true;
    console.log("[useUnreadMessageCount] Initializing for userId:", userId);

    async function fetchUnread() {
      try {
        console.log("[useUnreadMessageCount] Fetching unread from API...");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error("[useUnreadMessageCount] Fetch failed:", res.status, res.statusText);
          return;
        }

        const data = await res.json();
        console.log("[useUnreadMessageCount] API response:", data);
        setUnreadCount(data.count || 0);
      } catch (error) {
        console.error("[useUnreadMessageCount] Error fetching unread count:", error);
      }
    }

    fetchUnread();

    const channel = supabase
      .channel(`messages-unread-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        console.log("[Realtime] INSERT:", payload.new);

        try {
          const { data: conv } = await supabase
            .from("conversations")
            .select("user1_id, user2_id")
            .eq("id", payload.new.conversation_id)
            .single();

          if (!conv) {
            console.warn("[Realtime] No conversation found for message:", payload.new);
            return;
          }

          if (conv.user1_id === userId || conv.user2_id === userId) {
            if (payload.new.sender_id !== userId) {
              console.log("[Realtime] New unread message detected!");
              setUnreadCount((prev) => prev + 1);
            }
          }
        } catch (err) {
          console.error("[Realtime INSERT error]:", err);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, async (payload) => {
        console.log("[Realtime] UPDATE:", payload.new);

        try {
          const { data: conv } = await supabase
            .from("conversations")
            .select("user1_id, user2_id")
            .eq("id", payload.new.conversation_id)
            .single();

          if (!conv) {
            console.warn("[Realtime] No conversation found for update:", payload.new);
            return;
          }

          if (conv.user1_id === userId || conv.user2_id === userId) {
            if (payload.new.sender_id !== userId && payload.new.is_read) {
              console.log("[Realtime] Message marked as read");
              setUnreadCount((prev) => Math.max(prev - 1, 0));
            }
          }
        } catch (err) {
          console.error("[Realtime UPDATE error]:", err);
        }
      })
      .subscribe((status) => console.log("[Supabase channel status]:", status));

    return () => {
      console.log("[useUnreadMessageCount] Cleaning up channel...");
      supabase.removeChannel(channel);
      initializedRef.current = false;
    };
  }, [userId, token]);

  return unreadCount;
}
