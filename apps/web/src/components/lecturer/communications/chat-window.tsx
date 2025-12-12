

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Loader2, MessageSquare, MoreVertical, Paperclip, RotateCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@packages/data/supabaseClient";
import { Conversation, Message } from "./communication-panel";
import { FileIcon, defaultStyles } from "react-file-icon";
import { getAvatarColor } from "@/utils/color-hash";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import EmptyState from "@/components/empty-state";
import { formatDateLabel } from "@/utils/format-date-label";
import Lightbox from "@/components/light-box";

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
    const [messages, setMessages] = useState<Message[]>([]);
    const [sending, setSending] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null); // Ẩn menu
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!selectedConversation?.id || !token) return;

        const fetchMessages = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/messages?conversationId=${selectedConversation.id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (!res.ok) throw new Error("Không thể tải tin nhắn");
                const data = await res.json();
                setMessages(data);
            } catch (err) {
                console.error(err);
                toast.error("Lỗi khi tải tin nhắn");
            }
        };

        fetchMessages();
    }, [selectedConversation?.id, token]);

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

                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });

                    setConversations((prev) =>
                        prev.map((c) =>
                            c.id === conversationId ? { ...c, lastMessage: newMsg } : c
                        )
                    );
                }
            )

            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const updatedMsg = payload.new as Message;
                    setMessages((prev) =>
                        prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
                    );

                    setConversations((prev) =>
                        prev.map((c) =>
                            c.id === conversationId && c.lastMessage?.id === updatedMsg.id
                                ? { ...c, lastMessage: updatedMsg }
                                : c
                        )
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedConversation, setConversations]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    const uploadFile = async (file: File): Promise<string> => {
        const ext = file.name.split(".").pop() || "dat";

        const now = new Date();
        const yyyymmddhhmmss =
            now.getFullYear().toString() +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0") +
            String(now.getHours()).padStart(2, "0") +
            String(now.getMinutes()).padStart(2, "0") +
            String(now.getSeconds()).padStart(2, "0");

        const fileName = `IMG${yyyymmddhhmmss}.${ext}`;

        const { error } = await supabase
            .storage
            .from("chat-uploads")
            .upload(fileName, file);

        if (error) throw error;

        const { data } = supabase
            .storage
            .from("chat-uploads")
            .getPublicUrl(fileName);

        return data.publicUrl;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
        if (selectedFiles.length === 0) return;

        const newPreviews = selectedFiles.map((f) =>
            f.type.startsWith("image/") ? URL.createObjectURL(f) : ""
        );

        setFiles((prev) => [...prev, ...selectedFiles]);
        setPreviewUrls((prev) => [...prev, ...newPreviews]);
    };

    const removePreview = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if ((!message.trim() && files.length === 0) || !selectedConversation || !myId)
            return;
        setSending(true);

        try {
            const receiverId =
                selectedConversation.user1.id === myId
                    ? selectedConversation.user2.id
                    : selectedConversation.user1.id;

            if (message.trim()) {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        receiverId,
                        content: message.trim(),
                        type: "text",
                    }),
                });
            }

            for (const file of files) {
                const url = await uploadFile(file);
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        receiverId,
                        content: url,
                        type: file.type.startsWith("image/") ? "image" : "file",
                    }),
                });
            }

            setMessage("");
            setFiles([]);
            setPreviewUrls([]);
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi gửi tin nhắn");
        } finally {
            setSending(false);
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const partner =
        selectedConversation && selectedConversation.user1.id === myId
            ? selectedConversation.user2
            : selectedConversation
                ? selectedConversation.user1
                : { id: null, full_name: "", avatar_url: "", role: "" };

    const initials = useMemo(() => {
        const parts = partner.full_name.trim().split(" ");
        return parts[parts.length - 1]?.[0]?.toUpperCase() ?? "?";
    }, [partner.full_name]);

    const bgColor = useMemo(
        () =>
            getAvatarColor(
                partner.id ? String(partner.id) : partner.full_name || "?"
            ),
        [partner.id, partner.full_name]
    );

    const recallMessage = async (messageId: number) => {
        if (!token) return;
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${messageId}/recall`,
                {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("Đã thu hồi tin nhắn");
        } catch (err: any) {
            toast.error(err.message || "Không thể thu hồi tin nhắn");
        }
    };

    const deleteMessage = async (messageId: number) => {
        if (!token || !selectedConversation || myId === null) return;
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${messageId}/delete`,
                {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const updatedMessages = messages.map(msg =>
                msg.id === messageId
                    ? { ...msg, deleted_by: [...(msg.deleted_by || []), myId] }
                    : msg
            );
            setMessages(updatedMessages);

            const lastMessage = [...updatedMessages]
                .reverse()
                .find(msg => !(msg.deleted_by || []).includes(myId)) || null;

            setConversations(prev =>
                prev.map(conv =>
                    conv.id === selectedConversation.id
                        ? { ...conv, messages: updatedMessages, lastMessage }
                        : conv
                )
            );
            setSelectedConversation(prev =>
                prev ? { ...prev, messages: updatedMessages, lastMessage } : null
            );

            toast.success("Đã xoá tin nhắn");
        } catch (err: any) {
            toast.error(err.message || "Không thể xoá tin nhắn");
        }
    };

    const canRecall = (msg: Message) => {
        if (!msg.created_at) return false;
        const now = new Date();
        const created = new Date(msg.created_at);
        const diffMinutes = (now.getTime() - created.getTime()) / 1000 / 60;
        return diffMinutes <= 5;
    };

    const downloadFile = async (url: string, filename: string) => {
        try {
            const res = await fetch(url);
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Tải file thất bại", err);
        }
    };

    if (!selectedConversation)
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <EmptyState
                    icon={<MessageSquare className="w-10 h-10" />}
                    text="Chọn một cuộc trò chuyện để bắt đầu"
                    className="py-1"
                />
            </div>
        );

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

    const renderMessageContent = (msg: Message, prevMsg: Message | null) => {
        if (msg.is_recalled) {
            return (
                <span className="italic text-gray-500">
                    Tin nhắn đã được thu hồi
                </span>
            );
        }

        if (msg.is_deleted) return null;

        if (msg.type === "image") {
            return (
                <img
                    src={msg.content}
                    className="rounded-lg max-w-full max-h-64 object-cover cursor-pointer"
                    onClick={() => setPreviewImage(msg.content)}
                />
            );
        }

        if (msg.type === "file") {
            return (
                <a
                    href={msg.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg border bg-background hover:bg-muted transition-colors w-fit"
                >
                    <div className="w-6 h-6">
                        <FileIcon
                            extension={msg.content.split(".").pop()?.toLowerCase() || ""}
                            {...defaultStyles[msg.content.split(".").pop()?.toLowerCase() || "default"]}
                        />
                    </div>
                    <span className="truncate text-sm text-primary underline">
                        {msg.content.split("/").pop()}
                    </span>
                </a>
            );
        }

        return <span>{msg.content}</span>;
    };


    return (
        <div className="flex flex-col flex-1 h-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-3 bg-background sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 sm:w-10 sm:h-10">
                        {partner.avatar_url ? (
                            <AvatarImage src={partner.avatar_url} />
                        ) : (
                            <AvatarFallback
                                className={`text-lg font-semibold ${bgColor} text-white`}
                            >
                                {initials}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div>
                        <div className="font-semibold">{partner.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                            {getRoleLabel(partner.role)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Danh sách tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
                {messages.map((msg, index) => {

                    if (myId !== null && msg.deleted_by?.includes(myId)) return null;

                    const prevMsg = messages[index - 1];
                    const msgDate = new Date(msg.created_at);
                    const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
                    const isNewDay =
                        !prevDate || msgDate.toDateString() !== prevDate.toDateString();

                    const isMine = msg.sender_id === myId;

                    return (
                        <div key={`${msg.id}-${index}`} className="relative">

                            {/* Hiển thị ngày */}
                            {isNewDay && (
                                <div className="flex justify-center my-3">
                                    <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                        {formatDateLabel(msgDate)}
                                    </div>
                                </div>
                            )}

                            {/* Container tin nhắn */}
                            <div className={`group flex ${isMine ? "justify-end" : "justify-start"} items-start gap-2 w-full relative`}>
                                <div className={`flex ${isMine ? null : "flex-row-reverse"} gap-1 max-w-[75%]`}>

                                    <div className={`relative`}>
                                        <button
                                            onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                                            className={`cursor-pointer opacity-0 group-hover:opacity-100 transition p-1 rounded-full hover:bg-gray-200`}
                                        >
                                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                                        </button>

                                        {openMenuId === msg.id && (
                                            <div
                                                ref={menuRef}
                                                className={`absolute top-0 z-50 w-36 bg-white border shadow-lg rounded-lg py-2
                                                ${isMine ? "right-full mr-2" : "left-full ml-2"} transition-all`}
                                            >
                                                <button
                                                    onClick={() => deleteMessage(msg.id)}
                                                    className="text-xs cursor-pointer w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-red-600 font-medium"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Xóa
                                                </button>

                                                {isMine && !msg.is_recalled && !msg.is_deleted && canRecall(msg) && (
                                                    <button
                                                        onClick={() => recallMessage(msg.id)}
                                                        className="cursor-pointer w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-xs text-blue-600 font-medium"
                                                    >
                                                        <RotateCw className="w-4 h-4" />
                                                        Thu hồi
                                                    </button>
                                                )}

                                                {(msg.type === "image" || msg.type === "file") && (
                                                    <button
                                                        onClick={() => downloadFile(msg.content, msg.content.split("/").pop() || "file")}
                                                        className="text-xs cursor-pointer w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 font-medium"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Tải về máy
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className={`text-sm rounded-lg px-3 py-2 max-w-full break-anywhere group relative ${isMine ? "bg-[#D6E4FF] text-black" : "bg-muted text-foreground"
                                            }`}
                                    >
                                        {renderMessageContent(msg, prevMsg)}

                                        {/* Thời gian */}
                                        <div
                                            className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${msg.sender_id === myId ? "opacity-90" : "text-muted-foreground"
                                                }`}
                                        >
                                            <span
                                                className={
                                                    msg.sender_id === myId ? "text-black" : "text-muted-foreground"
                                                }
                                            >
                                                {formatTime(msg.created_at)}
                                            </span>

                                            {msg.sender_id === myId && index === messages.length - 1 && (
                                                msg.is_read ? (
                                                    <span className="text-primary font-medium ml-1">Đã xem</span>
                                                ) : (
                                                    <span className="text-gray-700 ml-1">Đã gửi</span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div ref={messagesEndRef} />
            </div>

            {/* Xem trước file */}
            {files.length > 0 && (
                <div className="p-3 border-t bg-muted/30 flex flex-wrap gap-3 overflow-x-auto">
                    {files.map((file, idx) => (
                        <div key={idx} className="relative">
                            {previewUrls[idx] ? (
                                <img
                                    src={previewUrls[idx]}
                                    alt="preview"
                                    className="w-20 h-20 object-cover rounded-lg border"
                                />
                            ) : (
                                <div className="flex items-center gap-2 border rounded-lg px-2 py-1 bg-background">
                                    <div className="w-6 h-6">
                                        <FileIcon
                                            extension={file.name.split(".").pop() || ""}
                                            {...defaultStyles[file.name.split(".").pop() || "default"]}
                                        />
                                    </div>
                                    <span className="text-sm truncate max-w-[120px]">
                                        {file.name}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => removePreview(idx)}
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Ô nhập */}
            <div className="p-3 border-t flex gap-2 shrink-0 bg-background sticky bottom-0 z-10">
                <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <input
                    type="file"
                    id="fileInput"
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                />
                <Button
                    variant="outline"
                    onClick={() => document.getElementById("fileInput")?.click()}
                >
                    <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                    onClick={handleSend}
                    disabled={sending || (!message.trim() && files.length === 0)}
                >
                    {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Gửi
                </Button>
            </div>

            <Lightbox src={previewImage} onClose={() => setPreviewImage(null)} />
        </div>
    );
}