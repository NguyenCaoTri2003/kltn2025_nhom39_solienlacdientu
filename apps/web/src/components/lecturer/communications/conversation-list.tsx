import { useMemo } from "react";
import { Conversation } from "./communication-panel";
import { getAvatarColor } from "@/utils/color-hash";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  myId: number | null;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  myId,
}: ConversationListProps) {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getRoleLabel = (role?: string): string => {
    switch (role) {
      case "student":
        return "SV";
      case "lecturer":
        return "GV";
      case "parent":
        return "PH";
      default:
        return "N/A";
    }
  };

  const sortedConversations = [...conversations].sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
    const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
    return timeB - timeA; // mới nhất lên trước
  });

  const getMessagePreview = (conv: Conversation) => {
    if (!conv.lastMessage) return "Không có tin nhắn";

    const msg = conv.lastMessage;
    const sender =
      msg.sender_id === myId
        ? "Bạn"
        : conv.user1.id === msg.sender_id
        ? conv.user1.full_name
        : conv.user2.full_name;

    let contentPreview = "";

    switch (msg.type) {
      case "image":
        contentPreview = "Đã gửi 1 ảnh";
        break;
      case "file":
        contentPreview = "Đã gửi 1 tệp tin";
        break;
      default:
        contentPreview =
          msg.content.length > 40 ? msg.content.slice(0, 40) + "..." : msg.content;
    }

    return `${sender}: ${contentPreview}`;
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {sortedConversations.map((conv) => {
        const other = conv.user1.id === myId ? conv.user2 : conv.user1;
        const initials = useMemo(() => {
          const parts = other.full_name.trim().split(" ");
          return parts[parts.length - 1]?.[0]?.toUpperCase() ?? "?";
        }, [other.full_name]);

        const bgColor = useMemo(
          () => getAvatarColor(other.id ? String(other.id) : other.full_name || "?"),
          [other.id, other.full_name]
        );

        const isUnread = conv.unreadCount && conv.unreadCount > 0;

        return (
          <div
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-border hover:bg-accent transition-colors ${
              selectedConversation?.id === conv.id ? "bg-accent/70" : ""
            }`}
          >
            {/* Avatar */}
            <Avatar className="w-12 h-12">
              {other.avatar_url ? <AvatarImage src={other.avatar_url} /> : null}
              <AvatarFallback className={`text-lg font-semibold ${bgColor} text-white`}>
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Nội dung */}
            <div className="flex-1 min-w-0">
              {/* Dòng trên: tên + giờ */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <span
                    className={`truncate max-w-[160px] ${
                      isUnread ? "font-semibold text-foreground" : "font-medium"
                    }`}
                  >
                    {other.full_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({getRoleLabel(other.role)})
                  </span>
                </div>
                {conv.lastMessage && (
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatTime(conv.lastMessage.created_at)}
                  </span>
                )}
              </div>

              {/* Dòng dưới: nội dung + số chưa đọc */}
              <div className="flex justify-between items-center mt-0.5">
                <span
                  className={`truncate max-w-[75%] text-sm ${
                    isUnread
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {getMessagePreview(conv)}
                </span>

                {/* Badge số tin chưa đọc */}
                {(conv.unreadCount ?? 0) > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-[11px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
