export const conversationService = {
  async getOrCreateConversation(token: string, receiverId: number) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/conversations/with?otherUserId=${receiverId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (data?.id) return data;
    }

    const create = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receiverId }),
    });

    if (!create.ok) throw new Error("Không thể tạo cuộc trò chuyện mới");
    return create.json();
  },
};
