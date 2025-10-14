import { Conversation } from "./communication-panel";

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
        return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    function getRoleLabel(role?: string): string {
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
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => {
                const other = conv.user1.id === myId ? conv.user2 : conv.user1;
                return (
                    <div
                        key={conv.id}
                        onClick={() => onSelectConversation(conv)}
                        className={`p-3 cursor-pointer border-b hover:bg-accent ${selectedConversation?.id === conv.id ? "bg-accent/70" : ""
                            }`}
                    >
                        <div className="font-medium">{other.full_name} ({getRoleLabel(other.role)})</div>
                        <div className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage
                                ? `${conv.lastMessage.content} • ${formatTime(conv.lastMessage.created_at)}`
                                : "Không có tin nhắn"}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
