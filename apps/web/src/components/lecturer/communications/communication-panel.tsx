"use client";

import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useCommunicationContext } from "@/context/message-provider";
import ConversationList from "./conversation-list";
import EmptyState from "@/components/empty-state";
import { is } from "date-fns/locale";
import { useEffect } from "react";

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
  is_recalled?: boolean;
  is_deleted?: boolean;
  _showMenu?: boolean;
  deleted_by?: number[];
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

  const pathname = usePathname();

  useEffect(() => {
    if (!conversations.length) return;

    // Lấy id từ URL
    const parts = pathname.split("/");
    const convIdStr = parts[parts.length - 1];
    const convId = Number(convIdStr);

    const conv = conversations.find(c => c.id === convId);
    if (conv && conv.id !== selectedConversation?.id) {
      setSelectedConversation(conv);
    }
  }, [pathname, conversations, selectedConversation]);

  return (
    <div className="w-80 border-r border-border flex flex-col">
      <div className="p-4 border-b font-semibold">Tin nhắn</div>

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
          <Button
            onClick={() =>
              router.push(userRole === "lecturer" ? "/lecturer/classes" : "/portal/classes")
            }
          >
            Đến lớp học
          </Button>
        </div>
      ) : (
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
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