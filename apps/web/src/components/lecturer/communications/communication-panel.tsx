"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ConversationList from "./conversation-list";
import ChatWindow from "./chat-window";
import { supabase } from "@packages/data/supabaseClient";
import EmptyState from "@/components/empty-state";

export interface User {
  avatar_url: string;
  id: number;
  full_name: string;
  role?: string;
}

export interface Message {
  type: string;
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  user1: User;
  user2: User;
  lastMessage?: Message | null;
  messages?: Message[];
}

export default function CommunicationPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const getMyUserId = (): number | null => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.id || null;
    } catch {
      return null;
    }
  };

  // Fetch conversation list
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tải danh sách cuộc trò chuyện");
      setConversations(data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchConversations();
  }, [token]);

  return (
    <div className="flex flex-1 h-full bg-background overflow-hidden">
      {/* LEFT */}
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
            <Button onClick={() => router.push("/lecturer/classes")}>Đến lớp học</Button>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
            myId={getMyUserId()}
          />
        )}
      </div>

      {/* RIGHT */}
      <ChatWindow
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
        conversations={conversations}
        setConversations={setConversations}
        myId={getMyUserId()}
      />
    </div>
  );
}
