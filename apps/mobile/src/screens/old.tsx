import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../hooks/useMessages";
import { useMessageContext } from "../context/MessageProvider";

export default function ChatScreen({ route }: any) {
  const { conversationId, receiverId, receiverName } = route.params;
  const { token, user } = useAuth();
  const myId = user?.id;
  const { setConversations } = useMessageContext();

  const flatListRef = useRef<FlatList>(null);
  const [content, setContent] = useState("");
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);

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

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      });
    }
  }, [messages.length]);

  useEffect(() => {
    if (isNearBottom && messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (layoutMeasurement.height + contentOffset.y);
    setIsNearBottom(distanceFromBottom < 100);
  };

  const handleSend = async () => {
    if (!content.trim()) return;
    await sendMessage(receiverId, content.trim(), "text");
    setContent("");
  };

  const handleSendImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Vui lòng cấp quyền truy cập thư viện ảnh để gửi hình ảnh.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      await sendMessage(receiverId, "", "image", asset.uri, asset.fileName || undefined);
    }
  };

  // Chọn nhiều ảnh
  const handleSelectImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Vui lòng cấp quyền truy cập thư viện ảnh để gửi hình ảnh.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // 🔥 Cho chọn nhiều ảnh
      quality: 1,
    });

    if (!res.canceled && res.assets?.length) {
      setSelectedImages((prev) => [...prev, ...res.assets]);
    }
  };

  const handleSendFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", 
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await sendMessage(receiverId, "", "file", file.uri, file.name);
      }
    } catch (error) {
      console.error("Lỗi khi chọn file:", error);
    }
  };

  const renderMessage = ({ item, index }: any) => {
    const isMine = item.sender_id === myId;
    const isLastMine =
      isMine &&
      (index === messages.length - 1 ||
        messages[index + 1].sender_id !== myId);
    const readLabel = isLastMine
      ? item.is_read
        ? "Đã xem"
        : "Đã gửi"
      : null;

    return (
      <View
        style={[
          styles.messageBubble,
          isMine ? styles.rightBubble : styles.leftBubble,
        ]}
      >
        {item.type === "text" && (
          <Text style={styles.messageText}>{item.content}</Text>
        )}

        {item.type === "image" && (
          <TouchableOpacity onPress={() => Linking.openURL(item.content)}>
            <Image source={{ uri: item.content }} style={styles.image} />
          </TouchableOpacity>
        )}

        {item.type === "file" && (
          <TouchableOpacity
            style={styles.file}
            onPress={() => Linking.openURL(item.content)}
          >
            <Ionicons name="document-outline" size={20} color="#007AFF" />
            <Text numberOfLines={1} style={styles.fileName}>
              {item.file_name || "Tệp đính kèm"}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.metaInfo}>
          <Text style={styles.time}>{dayjs(item.created_at).format("HH:mm")}</Text>
          {readLabel && <Text style={styles.readLabel}>{readLabel}</Text>}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{receiverName}</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        onContentSizeChange={() => {
          if (isNearBottom) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 80}
        style={{ marginBottom: Platform.OS === "ios" ? -40 : 4 }}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity onPress={handleSendImage}>
            <Ionicons name="image-outline" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSendFile} style={{ marginLeft: 8 }}>
            <Ionicons name="attach-outline" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="Nhập tin nhắn..."
          />

          <TouchableOpacity style={styles.send} onPress={handleSend}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  messageBubble: {
    marginVertical: 6,
    padding: 10,
    borderRadius: 12,
    maxWidth: "80%",
  },
  leftBubble: { backgroundColor: "#eee", alignSelf: "flex-start" },
  rightBubble: { backgroundColor: "#DCF8C6", alignSelf: "flex-end" },
  messageText: { fontSize: 16 },
  image: { width: 200, height: 200, borderRadius: 10 },
  file: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
  },
  fileName: { marginLeft: 6, color: "#007AFF", maxWidth: 180 },
  metaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  time: { fontSize: 12, color: "#777" },
  readLabel: { fontSize: 12, color: "#007AFF", marginLeft: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fafafa",
    marginBottom: Platform.OS === "ios" ? 8 : 4,
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  send: { backgroundColor: "#007AFF", padding: 10, borderRadius: 20 },
});
