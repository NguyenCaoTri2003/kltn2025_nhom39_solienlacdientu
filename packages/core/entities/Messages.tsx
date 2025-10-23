import { User } from "./Users";

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