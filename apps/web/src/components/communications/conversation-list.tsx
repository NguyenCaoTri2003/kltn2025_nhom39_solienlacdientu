import { useMemo } from "react";
import { Conversation } from "./communication-panel";
import { getAvatarColor } from "@/utils/color-hash"; // ⚠️ cần có hàm này (xem bên dưới)
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

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
                return "Sinh viên";
            case "lecturer":
                return "Giảng viên";
            case "parent":
                return "Phụ huynh";
            default:
                return "Không xác định";
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
                contentPreview = msg.content.length > 40 ? msg.content.slice(0, 40) + "..." : msg.content;
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
                    () =>
                        getAvatarColor(
                            other.id ? String(other.id) : other.full_name || "?"
                        ),
                    [other.id, other.full_name]
                );

                return (
                    <div
                        key={conv.id}
                        onClick={() => onSelectConversation(conv)}
                        className={`flex items-center gap-3 p-3 cursor-pointer border-b hover:bg-accent transition-colors ${selectedConversation?.id === conv.id ? "bg-accent/70" : ""
                            }`}
                    >
                        {/* Avatar */}
                        <Avatar className="w-10 h-10 sm:w-10 sm:h-10">
                            {other.avatar_url ? (
                                <AvatarImage src={other.avatar_url} />
                            ) : null}
                            <AvatarFallback
                                className={`text-lg font-semibold ${bgColor} text-white`}
                            >
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        {/* Nội dung */}
                        <div className="flex-1 min-w-0">
                            <div className=" flex gap-1 items-center">
                                <p className="font-medium single-ellipsis">{other.full_name} </p>
                                <span className="text-xs text-muted-foreground ml-1">
                                    ({getRoleLabel(other.role)})
                                </span>
                            </div>

                            <div className="text-sm text-muted-foreground flex justify-between items-center">
                                <span className="truncate max-w-[80%]">
                                    {getMessagePreview(conv)}
                                </span>
                                {conv.lastMessage && (
                                    <span className="text-xs shrink-0">
                                        {formatTime(conv.lastMessage.created_at)}
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
