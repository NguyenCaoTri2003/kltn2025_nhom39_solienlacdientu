import { useMemo } from "react";
import { useMessageContext } from "../context/MessageProvider";

export function useUnreadMessages() {
  const { conversations } = useMessageContext();

  // Tính tổng số tin nhắn chưa đọc từ tất cả các cuộc hội thoại
  const totalUnread = useMemo(() => {
    return conversations.reduce(
      (sum: any, c: any) => sum + (c.unreadCount ?? 0),
      0
    );
  }, [conversations]);

  return { totalUnread };
}
