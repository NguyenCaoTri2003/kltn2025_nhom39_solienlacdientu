// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Loader2, MessageCircle } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";
// import ConversationList from "./conversation-list";
// import ChatWindow from "./chat-window";
// import { supabase } from "@packages/data/supabaseClient";
// import EmptyState from "@/components/empty-state";
// import { is } from "date-fns/locale";

// export interface User {
//   avatar_url: string;
//   id: number;
//   full_name: string;
//   role?: string;
// }

// export interface Message {
//   conversation_id: number;
//   type: string;
//   id: number;
//   sender_id: number;
//   content: string;
//   created_at: string;
//   status: string;
//   is_read: boolean;
// }

// export interface Conversation {
//   id: number;
//   user1: User;
//   user2: User;
//   lastMessage?: Message | null;
//   messages?: Message[];
//   unreadCount?: number;
// }

// export default function CommunicationPanel({
//   initialConversationId,
// }: {
//   initialConversationId?: number;
// }) {
//   const [conversations, setConversations] = useState<Conversation[]>([]);
//   console.log("Conversations:", conversations);
//   const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();
//   const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

//   const getMyUserId = (): number | null => {
//     try {
//       const user = JSON.parse(localStorage.getItem("user") || "{}");
//       return user.id || null;
//     } catch {
//       return null;
//     }
//   };

//   const userRole: "admin" | "lecturer" | "student" | "parent" | null = (() => {
//     try {
//       const user = JSON.parse(localStorage.getItem("user") || "{}");
//       return user.role || null;
//     } catch {
//       return null;
//     }
//   })();

//   const fetchConversations = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations`, {
//         headers: { Authorization: `Bearer ${token}` },
//         cache: "no-store",
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Lỗi tải danh sách cuộc trò chuyện");
//       setConversations(data);
//     } catch (err) {
//       console.error(err);
//       toast.error("Không thể tải danh sách tin nhắn");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const selectedConversationRef = useRef<Conversation | null>(null);
//   useEffect(() => {
//     selectedConversationRef.current = selectedConversation;
//   }, [selectedConversation]);

//   useEffect(() => {
//     if (!token) return;

//     const myId = getMyUserId();
//     if (!myId) return;

//     const channel = supabase
//       .channel("messages-global")
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "messages",
//         },
//         (payload) => {
//           const newMsg = payload.new as Message;

//           if (newMsg.sender_id === myId) return;

//           setConversations((prev) => {
//             const existing = prev.find((c) => c.id === newMsg.conversation_id);

//             //   const isActive = selectedConversation?.id === newMsg.conversation_id;

//             //   return prev.map((c) =>
//             //     c.id === newMsg.conversation_id
//             //       ? {
//             //         ...c,
//             //         lastMessage: newMsg,
//             //         unreadCount: isActive
//             //           ? 0
//             //           : (c.unreadCount || 0) + 1,
//             //         messages: c.messages || [],
//             //       }
//             //       : c
//             //   );
//             // } 
//             if (existing) {
//               const isActive = selectedConversation?.id === newMsg.conversation_id;

//               return prev.map((c) => {
//                 if (c.id !== newMsg.conversation_id) return c;

//                 return {
//                   ...c,
//                   lastMessage: newMsg,
//                   unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1,
//                   messages: isActive
//                     ? [...(c.messages || []), newMsg]
//                     : c.messages || [],
//                 };
//               });
//             }
//             else {
//               fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations/${newMsg.conversation_id}`, {
//                 headers: { Authorization: `Bearer ${token}` },
//               })
//                 .then((res) => res.json())
//                 .then((conv) => {
//                   setConversations((p) => [
//                     { ...conv, unreadCount: 1 },
//                     ...p,
//                   ]);
//                 });
//               return prev;
//             }
//           });
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [token]);

//   useEffect(() => {
//     if (!token) return;
//     fetchConversations(); 
//   }, [token]);

//   useEffect(() => {
//     if (!initialConversationId || conversations.length === 0) return;
//     const found = conversations.find((c) => c.id === initialConversationId);
//     if (found) {
//       setSelectedConversation(found);
//     }
//   }, [initialConversationId, conversations]);

//   return (
//     <div className="flex flex-1 h-full bg-background overflow-hidden">
//       {/* LEFT */}
//       <div className="w-80 border-r border-border flex flex-col">
//         <div className="p-4 border-b font-semibold">Tin nhắn</div>

//         {loading ? (
//           <div className="flex items-center justify-center text-muted-foreground">
//             <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
//           </div>
//         ) : conversations.length === 0 ? (
//           <div className="flex flex-col items-center text-muted-foreground gap-1 text-center mt-2">
//             <EmptyState
//               icon={<MessageCircle className="w-10 h-10" />}
//               text="Không có cuộc trò chuyện nào"
//               className="py-1"
//             />
//             <Button onClick={() => router.push("/lecturer/classes")}>Đến lớp học</Button>
//           </div>
//         ) : (
//           <ConversationList
//             conversations={conversations}
//             selectedConversation={selectedConversation}
//             onSelectConversation={async (conv) => {
//               setSelectedConversation(conv);
//               if (userRole == "lecturer") router.push(`/lecturer/communications/${conv.id}`);
//               else if (userRole == "student") router.push(`/portal/communications/${conv.id}`);
//               else if (userRole == "parent") router.push(`/portal/communications/${conv.id}`);

//               if (conv.unreadCount && conv.unreadCount > 0) {
//                 try {
//                   await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/read`, {
//                     method: "POST",
//                     headers: {
//                       "Content-Type": "application/json",
//                       Authorization: `Bearer ${token}`,
//                     },
//                     body: JSON.stringify({ conversationId: conv.id }),
//                   });

//                   setConversations((prev) =>
//                     prev.map((c) =>
//                       c.id === conv.id ? { ...c, unreadCount: 0 } : c
//                     )
//                   );
//                 } catch (err) {
//                   console.error("Không thể đánh dấu đã đọc:", err);
//                 }
//               }
//             }}
//             myId={getMyUserId()}
//           />

//         )}
//       </div>

//       {/* RIGHT */}
//       <ChatWindow
//         selectedConversation={selectedConversation}
//         setSelectedConversation={setSelectedConversation}
//         conversations={conversations}
//         setConversations={setConversations}
//         myId={getMyUserId()}
//       />
//     </div>
//   );
// }

"use client";

import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCommunicationContext } from "@/context/message-provider";
import ConversationList from "./conversation-list";
import EmptyState from "@/components/empty-state";

export interface User {
  avatar_url: string;
  id: number;
  full_name: string;
  role?: string;
}

export interface Message {
  conversation_id: number;
  type: string;
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  status: string;
  is_read: boolean;
}

export interface Conversation {
  id: number;
  user1: User;
  user2: User;
  lastMessage?: Message | null;
  messages?: Message[];
  unreadCount?: number;
}

export default function CommunicationPanel() {
  const { conversations, setConversations, myId, loading, selectedConversation, setSelectedConversation } = useCommunicationContext();
  const router = useRouter();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "{}")
    : {};
  const userRole = user.role;

  return (
    <div className="w-80 border-r border-border flex flex-col bg-background overflow-hidden">
      <div className="shrink-0 px-5 py-4 border-b border-border bg-background font-semibold text-foreground">Tin nhắn</div>

      {loading ? (
        <div className="flex items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center text-muted-foreground gap-1 text-center mt-2">
          <EmptyState
            icon={<MessageCircle className="w-10 h-10" />}
            text="Không có cuộc trò chuyện nào"
            className="py-1"
          />
          <Button onClick={() => router.push("/lecturer/classes")}>Đến lớp học</Button>
        </div>
      ) : (
        <ConversationList
          conversations={conversations}
          selectedConversation= {selectedConversation}
          onSelectConversation={async (conv) => {
            setSelectedConversation(conv);
            if (userRole == "lecturer") router.push(`/lecturer/communications/${conv.id}`);
            else if (userRole == "student") router.push(`/portal/communications/${conv.id}`);
            else if (userRole == "parent") router.push(`/portal/communications/${conv.id}`);

            if (conv.unreadCount && conv.unreadCount > 0) {
              try {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/read`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ conversationId: conv.id }),
                });
                setConversations((prev) =>
                  prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                );
              } catch (err) {
                console.error("Không thể đánh dấu đã đọc:", err);
                toast.error("Không thể đánh dấu đã đọc");
              }
            }
          }}
          myId={myId}
        />
      )}
    </div>
  );
}
