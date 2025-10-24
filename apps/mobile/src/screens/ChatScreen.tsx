import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../hooks/useMessages";
import { useMessageContext } from "../context/MessageProvider";
import dayjs from "dayjs";

export default function ChatScreen() {
  const route = useRoute<RouteProp<any>>();
  const { conversationId, receiverId, receiverName } = route.params as any;
  const { token, user } = useAuth();
  const myId = user?.id;
  const { setConversations } = useMessageContext();

  const handleMarkRead = useCallback(() => {
    setConversations((prev: any) =>
      prev.map((c: any) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, [conversationId, setConversations]);

  if (!token || !myId) return null;

  const { messages, sendMessage } = useMessages(
    conversationId,
    myId!,
    token,
    handleMarkRead
  );

  const [content, setContent] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (!content.trim()) return;
    await sendMessage(receiverId, content.trim());
    setContent("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  useEffect(() => {
    if (messages.length > 0)
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }, [messages.length]);

  const formatTime = (t: string) => dayjs(t).format("HH:mm");

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{receiverName}</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isMine = item.sender_id === myId;
          return (
            <View
              style={[
                styles.messageBubble,
                isMine ? styles.rightBubble : styles.leftBubble,
              ]}
            >
              <Text style={styles.messageText}>{item.content}</Text>
              <View style={styles.metaContainer}>
                <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
                {isMine && (
                  <Text style={styles.statusText}>
                    {item.is_read ? "Đã xem" : "Đã gửi"}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 16 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputContainer}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Nhập tin nhắn..."
            style={styles.input}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendText}>Gửi</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { textAlign: "center", fontSize: 18, fontWeight: "bold", paddingVertical: 12 },
  messageBubble: {
    marginVertical: 6,
    padding: 10,
    borderRadius: 12,
    maxWidth: "80%",
  },
  leftBubble: { alignSelf: "flex-start", backgroundColor: "#eee" },
  rightBubble: { alignSelf: "flex-end", backgroundColor: "#DCF8C6" },
  messageText: { fontSize: 16 },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 6,
  },
  timeText: { fontSize: 12, color: "#777" },
  statusText: { fontSize: 12, color: "#007AFF" },
  inputContainer: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontWeight: "bold" },
});
