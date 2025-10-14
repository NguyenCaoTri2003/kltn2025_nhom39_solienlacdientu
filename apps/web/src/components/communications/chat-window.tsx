"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@packages/data/supabaseClient";
import { Conversation, Message, User } from "./communication-panel";

interface ChatWindowProps {
    selectedConversation: Conversation | null;
    setSelectedConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
    conversations: Conversation[];
    setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
    myId: number | null;
}

export default function ChatWindow({
    selectedConversation,
    setSelectedConversation,
    conversations,
    setConversations,
    myId,
}: ChatWindowProps) {
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Realtime messages
    useEffect(() => {
        if (!selectedConversation) return;
        const conversationId = selectedConversation.id;
        const channel = supabase
            .channel(`messages:conversationId=${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setSelectedConversation((prev) =>
                        prev
                            ? {
                                ...prev,
                                messages: [...(prev.messages || []), newMsg],
                                lastMessage: newMsg,
                            }
                            : prev
                    );

                    setConversations((prev) =>
                        prev.map((c) => (c.id === conversationId ? { ...c, lastMessage: newMsg } : c))
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [selectedConversation?.messages]);

    const fetchMessages = async (conversationId: number) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages?conversationId=${conversationId}`, {
                headers: { Authorization: `Bearer ${token}` },
                cache: "no-store",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Lỗi tải tin nhắn");

            const messages: Message[] = data.map((msg: any) => ({
                id: msg.id,
                sender_id: msg.sender_id ?? msg.sender?.id,
                content: msg.content ?? "(không có nội dung)",
                created_at: msg.created_at ?? new Date().toISOString(),
            }));

            setSelectedConversation((prev) => (prev ? { ...prev, messages } : null));
        } catch (err) {
            console.error(err);
            toast.error("Không thể tải tin nhắn");
        }
    };

    const handleSend = async () => {
        if (!message.trim() || !selectedConversation || !myId) return;

        const tempMessage: Message = {
            id: Date.now(),
            sender_id: myId,
            content: message,
            created_at: new Date().toISOString(),
        };

        setSelectedConversation((prev) =>
            prev ? { ...prev, messages: [...(prev.messages || []), tempMessage] } : prev
        );

        setMessage("");
        setSending(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    receiverId:
                        selectedConversation.user1.id === myId
                            ? selectedConversation.user2.id
                            : selectedConversation.user1.id,
                    content: tempMessage.content,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gửi tin nhắn thất bại");

            const serverMessage: Message = {
                ...data,
                sender_id: data.sender_id ?? myId,
                content: data.content ?? tempMessage.content,
                created_at: data.created_at ?? new Date().toISOString(),
            };

            setSelectedConversation((prev) => {
                if (!prev) return prev;
                const updatedMessages = prev.messages?.map((m) => (m.id === tempMessage.id ? serverMessage : m));
                return { ...prev, messages: updatedMessages, lastMessage: serverMessage };
            });

            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === selectedConversation.id ? { ...conv, lastMessage: serverMessage } : conv
                )
            );
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi gửi tin nhắn");
        } finally {
            setSending(false);
        }
    };

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

    if (!selectedConversation)
        return <div className="flex-1 flex items-center justify-center text-muted-foreground">Chọn một cuộc trò chuyện để xem tin nhắn</div>;

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="border-b p-3 font-semibold shrink-0">
                {selectedConversation.user1.id === myId
                    ? selectedConversation.user2.full_name
                    : selectedConversation.user1.full_name}
                {" ("}
                {getRoleLabel(
                    selectedConversation.user1.id === myId
                        ? selectedConversation.user2.role
                        : selectedConversation.user1.role
                )}
                {")"}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {selectedConversation.messages?.map((msg, index) => (
                    <div key={`${msg.id}-${index}`} className={`flex ${msg.sender_id === myId ? "justify-end" : "justify-start"}`}>
                        <div className={`rounded-lg px-3 py-2 max-w-[70%] text-sm flex flex-col`}>
                            <span
                                className={`${msg.sender_id === myId ? "bg-primary text-white" : "bg-muted text-foreground"
                                    } rounded-lg px-3 py-2`}
                            >
                                {msg.content}
                            </span>
                            <span className="text-xs text-muted-foreground mt-1 self-end">{formatTime(msg.created_at)}</span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t flex gap-2 shrink-0 bg-background">
                <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button onClick={handleSend} disabled={sending || !message.trim()}>
                    {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Gửi
                </Button>
            </div>
        </div>
    );
}
