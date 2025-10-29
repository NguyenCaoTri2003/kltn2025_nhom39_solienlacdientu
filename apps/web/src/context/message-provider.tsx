"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

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
  unreadCount?: number;
  messages?: Message[];
}

interface CommunicationContextValue {
  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  selectedConversation: Conversation | null;
  setSelectedConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
  myId: number | null;
  loading: boolean;
  refreshConversations: () => Promise<void>;
}

const CommunicationContext = createContext<CommunicationContextValue | undefined>(undefined);

export function CommunicationProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const getMyUserId = (): number | null => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user.id || null;
    } catch {
      return null;
    }
  };

  const myId = getMyUserId();

  const refreshConversations = async () => {
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
    if (token) refreshConversations();
  }, [token]);

  return (
    <CommunicationContext.Provider
      value={{
        conversations,
        setConversations,
        selectedConversation,
        setSelectedConversation,
        myId,
        loading,
        refreshConversations,
      }}
    >
      {children}
    </CommunicationContext.Provider>
  );
}

export function useCommunicationContext() {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error("useCommunicationContext must be used within CommunicationProvider");
  }
  return context;
}
