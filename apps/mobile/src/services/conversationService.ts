import { API_URL } from "../constants/config";

export const conversationService = {
  async getOrCreateConversation(token: string, receiverId: number) {
    const res = await fetch(`${API_URL}/api/conversations?userId=${receiverId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 200) {
      const data = await res.json();
      if (data?.id) return data; 
    }

    const create = await fetch(`${API_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        receiverId,
        content: "Xin chào thầy/cô",
        type: "text",
      }),
    });

    if (!create.ok) throw new Error("Không thể tạo cuộc trò chuyện");
    return create.json(); 
  },
};
