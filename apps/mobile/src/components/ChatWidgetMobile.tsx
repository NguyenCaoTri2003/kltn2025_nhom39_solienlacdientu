import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Animated,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    PanResponder,
    Image,
} from "react-native";
import { API_URL } from "../constants/config";
import { getAuthToken } from "../utils/auth";
import { MaterialIcons } from '@expo/vector-icons';

type Message = { role: "user" | "bot"; text: string };

type ChatWidgetMobileProps = {
    style?: any;
};

export default function ChatWidgetMobile({ style }: ChatWidgetMobileProps) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "bot", text: "Xin chào, tôi là trợ lý Sổ Liên Lạc. Tôi có thể giúp gì cho bạn?" },
    ]);
    const [loading, setLoading] = useState(false);
    const [botTyping, setBotTyping] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    const pan = useRef(new Animated.ValueXY({ x: 20, y: 50 })).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => pan.setOffset({ x: pan.x._value, y: pan.y._value }),
            onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
            onPanResponderRelease: () => pan.flattenOffset(),
        })
    ).current;

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages, botTyping]);

    // Gửi tin nhắn
    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input;
        setMessages(prev => [...prev, { role: "user", text: userMessage }]);
        setInput("");
        setLoading(true);
        setBotTyping(true);

        try {
            const token = await getAuthToken();
            const res = await fetch(`${API_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await res.json();

            setMessages(prev => [...prev, { role: "bot", text: data.text }]);
        } catch (err) {
            console.error("Lỗi gửi tin nhắn:", err);
            setMessages(prev => [...prev, { role: "bot", text: "Lỗi server, thử lại sau" }]);
        } finally {
            setLoading(false);
            setBotTyping(false);
        }
    };

    const renderItem = ({ item }: { item: Message }) => (
        <View style={[styles.messageContainer, item.role === "user" ? styles.userMessage : styles.botMessage]}>
            <Text style={item.role === "user" ? styles.userText : styles.botText}>{item.text}</Text>
        </View>
    );

    return (
        <>
            <Animated.View
                style={[styles.floatingButton, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity onPress={() => setOpen(!open)}>
                    <Image
                        source={require("../../assets/smart-chatbot.png")} 
                        style={{ width: 48, height: 48, resizeMode: "contain" }}
                    />
                </TouchableOpacity>
            </Animated.View>

            {open && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={styles.chatContainer}
                >
                    <View style={styles.header}>
                        <Text style={styles.headerText}>Trợ lý Sổ Liên Lạc Điện Tử</Text>
                        <TouchableOpacity onPress={() => setOpen(false)}>
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(_, i) => i.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ padding: 8 }}
                    />

                    {botTyping && (
                        <View style={[styles.messageContainer, styles.botMessage]}>
                            <Text style={styles.botText}>...</Text>
                        </View>
                    )}

                    {/* Input */}
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.input}
                            value={input}
                            onChangeText={setInput}
                            placeholder="Nhập tin nhắn..."
                            onSubmitEditing={sendMessage}
                            editable={!loading}
                        />
                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={loading || !input.trim()}
                            style={styles.sendButton}
                        >
                            <MaterialIcons name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    floatingButton: {
        position: "absolute",
        top: 720,
        right: 40,
        zIndex: 9999,
    },
    button: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#4FC3F7",
        justifyContent: "center",
        alignItems: "center",
    },
    chatContainer: {
        position: "absolute",
        bottom: 100,
        right: 20,
        width: 340,
        height: 520,
        backgroundColor: "#fff",
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
        overflow: "hidden",
    },
    header: {
        backgroundColor: "#4FC3F7",
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerText: { color: "#fff", fontWeight: "bold" },
    messageContainer: {
        marginVertical: 4,
        padding: 8,
        borderRadius: 12,
        maxWidth: "75%",
    },
    userMessage: { backgroundColor: "#4FC3F7", alignSelf: "flex-end" },
    botMessage: { backgroundColor: "#EEE", alignSelf: "flex-start" },
    userText: { color: "#fff" },
    botText: { color: "#000" },
    inputRow: {
        flexDirection: "row",
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: "#ddd",
        alignItems: "center",
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
    },
    sendButton: {
        width: 40,
        height: 40,
        backgroundColor: "#4FC3F7",
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
});
