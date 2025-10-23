import { useEffect, useState, useCallback } from "react";
import { messageService } from "../services/messageService";
import { useAuth } from "../context/AuthContext";
import { Conversation, Message } from "@packages/core/entities/Messages";
import { supabase } from "../lib/supabaseClient";

export function useConversations() {
    const { token } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchConversations = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await messageService.getConversations(token);
            setConversations(data);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    return { conversations, loading, refresh: fetchConversations };
}

export function useMessages(conversationId: number) {
    const { token, user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log("useMessages init:", { conversationId, tokenReady: !!token });
    }, [conversationId, token]);

    const fetchMessages = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await messageService.getMessages(conversationId, token);
            setMessages(data);
            await messageService.markAsRead(conversationId, token);
        } finally {
            setLoading(false);
        }
    }, [conversationId, token]);

    const sendMessage = useCallback(
        async (receiverId: number, content: string) => {
            if (!token) return;
            const newMsg = await messageService.sendMessage(receiverId, content, token);
            setMessages((prev) => [...prev, newMsg]);
        },
        [token]
    );

    // useEffect(() => {
    //     if (!conversationId || !token) return; 

    //     const channel = supabase
    //         .channel(`messages:conversationId=${conversationId}`)
    //         .on(
    //             "postgres_changes",
    //             {
    //                 event: "INSERT",
    //                 schema: "public",
    //                 table: "messages",
    //                 filter: `conversation_id=eq.${conversationId}`,
    //             },
    //             (payload) => {
    //                 setMessages((prev) => [...prev, payload.new as Message]);
    //             }
    //         )
    //         .subscribe();

    //     return () => {
    //         supabase.removeChannel(channel);
    //     };
    // }, [conversationId, token]);

    useEffect(() => {
        if (!conversationId || !token) return;

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
                async (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((prev) => [...prev, newMsg]);

                    // Nếu tin nhắn này KHÔNG phải của mình → đánh dấu đã đọc
                    if (newMsg.sender_id !== user?.id) {
                        try {
                            await messageService.markAsRead(conversationId, token);
                        } catch (err) {
                            console.warn("Mark as read failed:", err);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, token, user?.id]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    return { messages, loading, sendMessage, refresh: fetchMessages };
}
