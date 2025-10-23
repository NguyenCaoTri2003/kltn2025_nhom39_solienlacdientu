import { API_URL } from "../constants/config";
import { Message, Conversation } from "@packages/core/entities/Messages";

export const messageService = {
  async getConversations(token: string): Promise<Conversation[]> {
    const res = await fetch(`${API_URL}/api/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch conversations");
    return res.json();
  },

  async getMessages(conversationId: number, token: string): Promise<Message[]> {
    const res = await fetch(`${API_URL}/api/messages?conversationId=${conversationId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },

  async sendMessage(
    receiverId: number,
    content: string,
    token: string,
    type: "text" | "image" | "file" | "system" = "text"
  ): Promise<Message> {
    const res = await fetch(`${API_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receiverId, content, type }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },

  async markAsRead(conversationId: number, token: string) {
    await fetch(`${API_URL}/api/messages/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ conversationId }),
    });
  },

  async getUnreadCount(token: string): Promise<number> {
    const res = await fetch(`${API_URL}/api/messages/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.count || 0;
  },
};
