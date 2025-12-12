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
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useAuth } from "../context/AuthContext";
import { useMessages } from "../hooks/useMessages";
import { useMessageContext } from "../context/MessageProvider";
import { getRoleLabel } from "../utils/roleHelper";
import { messageService } from "../services/messageService";

export default function ChatScreen({ route }: any) {
  const { conversationId, receiverId, receiverName, receiverRole } = route.params;
  const { token, user } = useAuth();
  const myId = user?.id;
  const { setConversations } = useMessageContext();

  const flatListRef = useRef<FlatList>(null);
  const [content, setContent] = useState("");
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [actionVisible, setActionVisible] = useState(false);

  const handleMarkRead = useCallback(() => {
    setConversations((prev: any) =>
      prev.map((c: any) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, [conversationId, setConversations]);

  if (!token || !myId) return null;

  const { messages, sendMessage, updateLocalMessage, deleteLocalMessage } = useMessages(
    conversationId,
    myId,
    token,
    handleMarkRead
  );

  useEffect(() => {
    if (messages.length > 0 && isNearBottom) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length, isNearBottom]);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (layoutMeasurement.height + contentOffset.y);

    const nearBottom = distanceFromBottom < 150;
    setIsNearBottom(nearBottom);
    setShowScrollToBottom(!nearBottom);
  };

  const handleSend = async () => {
    if (!content.trim() && selectedImages.length === 0) return;
    if (sending) return;

    setSending(true);

    try {
      for (const img of selectedImages) {
        await sendMessage(receiverId, "", "image", img.uri, img.fileName || undefined);
      }

      if (content.trim()) {
        await sendMessage(receiverId, content.trim(), "text");
      }

      setContent("");
      setSelectedImages([]);
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleSelectImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Vui lòng cấp quyền truy cập thư viện ảnh để gửi hình ảnh.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
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

      if (!result.canceled && result.assets?.length > 0) {
        const file = result.assets[0];
        await sendMessage(receiverId, "", "file", file.uri, file.name);
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        });
      }
    } catch (error) {
      console.error("Lỗi khi chọn file:", error);
    }
  };

  const openAction = (message: any) => {
    setSelectedMessage(message);
    setActionVisible(true);
  };

  const closeAction = () => {
    setActionVisible(false);
    setSelectedMessage(null);
  };

  const handleRecall = async () => {
    if (!selectedMessage) return;
    const msg = selectedMessage;
    closeAction();

    try {
      const updated = await messageService.recallMessage(msg.id, token);

      updateLocalMessage(msg.id, (prevMsg) => {
        const newMsg = {
          ...prevMsg,
          ...updated,
          is_recalled: true,
          content: "Tin nhắn đã được thu hồi",
          type: "text",
        };

        setTimeout(() => {
          setConversations((prevConvs: any[]) =>
            prevConvs.map(c => {
              if (c.id !== conversationId) return c;

              const updatedMessages = prevConvs
                .find(conv => conv.id === conversationId)
                ?.messages?.map((m: { id: any; }) => (m.id === msg.id ? newMsg : m)) || [];

              const remainingMessages = updatedMessages.filter(
                (m: { deleted_by: string | any[]; is_recalled: any; }) => !m.deleted_by?.includes(myId) && !m.is_recalled
              );

              return {
                ...c,
                lastMessage: remainingMessages.slice(-1)[0] || newMsg,
              };
            })
          );
        }, 0);

        return newMsg;
      });
    } catch (e) {
      alert("Thu hồi thất bại");
    }
  };

  const handleDeleteLocal = async () => {
    const msg = selectedMessage;
    closeAction();

    try {
      await messageService.deleteMessage(msg.id, token);

      deleteLocalMessage(msg.id);

      setConversations((prev: any) =>
        prev.map((c: any) => {
          if (c.id !== conversationId) return c;

          const remainingMessages = messages
            .filter(m => m.id !== msg.id && !m.deleted_by?.includes(myId) && !m.is_recalled);

          return {
            ...c,
            lastMessage: remainingMessages.slice(-1)[0] || null,
          };
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  const renderMessage = ({ item, index }: any) => {
    const isMine = item.sender_id === myId;

    const isLastMine =
      isMine &&
      (index === messages.length - 1 ||
        messages[index + 1].sender_id !== myId);

    const readLabel = isLastMine ? (item.is_read ? "Đã xem" : "Đã gửi") : null;

    const isRecalled = item.is_recalled;
    const isDeleted = item.is_deleted;

    let contentView = null;

    if (item.deleted_by?.includes(myId)) return null;

    if (isRecalled) {
      contentView = <Text style={[styles.recalled]}>Tin nhắn đã được thu hồi</Text>;
    } else if (isDeleted) {
      return null;
    } else if (item.type === "text") {
      contentView = <Text style={styles.messageText}>{item.content}</Text>;
    } else if (item.type === "image") {
      contentView = (
        <TouchableOpacity onPress={() => Linking.openURL(item.content)}>
          <Image source={{ uri: item.content }} style={styles.image} />
        </TouchableOpacity>
      );
    } else if (item.type === "file") {
      contentView = (
        <TouchableOpacity
          style={styles.file}
          onPress={() => Linking.openURL(item.content)}
        >
          <Ionicons name="document-outline" size={20} color="#007AFF" />
          <Text style={styles.fileName} numberOfLines={1}>
            {item.file_name}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onLongPress={() => openAction(item)}
        delayLongPress={300}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.rightBubble : styles.leftBubble,
            isDeleted && { opacity: 0.4 },
          ]}
        >
          {contentView}

          <View style={styles.metaInfo}>
            <Text style={styles.time}>{dayjs(item.created_at).format("HH:mm")}</Text>
            {readLabel && <Text style={styles.readLabel}>{readLabel}</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerName}>{receiverName}</Text>
        {receiverRole && (
          <Text style={styles.headerRole}>
            ({getRoleLabel(receiverRole)})
          </Text>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        onContentSizeChange={() => {
          if (isNearBottom) flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <TouchableOpacity
          style={styles.scrollToBottomBtn}
          onPress={() => flatListRef.current?.scrollToEnd({ animated: true })}
        >
          <Ionicons name="chevron-down-circle" size={40} color="#007AFF" />
        </TouchableOpacity>
      )}

      {/* Selected Images Preview */}
      {selectedImages.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.previewContainer}
        >
          {selectedImages.map((img, i) => (
            <View key={i} style={styles.previewItem}>
              <Image source={{ uri: img.uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() =>
                  setSelectedImages((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                <Ionicons name="close-circle" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Input Row */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={{ marginBottom: Platform.OS === "ios" ? -40 : 0 }}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity onPress={handleSelectImages}>
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

          <TouchableOpacity style={styles.send} onPress={handleSend} disabled={sending}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal transparent visible={actionVisible} animationType="fade">
        <TouchableOpacity
          style={styles.actionOverlay}
          onPress={closeAction}
          activeOpacity={1}
        >
          <View style={styles.actionMenu}>
            {/* Recall */}
            {selectedMessage &&
              selectedMessage.sender_id === myId &&
              !selectedMessage.is_recalled &&
              dayjs().diff(dayjs(selectedMessage.created_at), "minute") < 5 && (
                <TouchableOpacity style={styles.actionItem} onPress={handleRecall}>
                  <Text style={styles.actionText}>Thu hồi tin nhắn</Text>
                </TouchableOpacity>
              )}

            {/* Delete local */}
            {!selectedMessage?.is_deleted && (
              <TouchableOpacity style={styles.actionItem} onPress={handleDeleteLocal}>
                <Text style={styles.actionText}>Xóa khỏi thiết bị</Text>
              </TouchableOpacity>
            )}

            {/* Open file / image */}
            {selectedMessage?.type === "image" || selectedMessage?.type === "file" ? (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => Linking.openURL(selectedMessage.content)}
              >
                <Text style={styles.actionText}>Mở tệp</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.actionCancel} onPress={closeAction}>
              <Text style={[styles.actionText, { color: "#ff4444" }]}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  messageBubble: { marginVertical: 6, padding: 10, borderRadius: 12, maxWidth: "80%" },
  leftBubble: { backgroundColor: "#eee", alignSelf: "flex-start" },
  rightBubble: { backgroundColor: "#D6E4FF", alignSelf: "flex-end" },
  messageText: { fontSize: 16 },
  image: { width: 200, height: 200, borderRadius: 10 },
  file: { flexDirection: "row", alignItems: "center", padding: 6, backgroundColor: "#f1f1f1", borderRadius: 8 },
  fileName: { marginLeft: 6, color: "#007AFF", maxWidth: 180 },
  metaInfo: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  time: { fontSize: 12, color: "#777" },
  readLabel: { fontSize: 12, color: "#007AFF", marginLeft: 8 },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 10, borderTopWidth: 1, borderTopColor: "#ddd", backgroundColor: "#fafafa", marginBottom: Platform.OS === "ios" ? 8 : 4 },
  input: { flex: 1, backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#ccc", marginHorizontal: 8, paddingHorizontal: 12, paddingVertical: 8 },
  send: { backgroundColor: "#007AFF", padding: 10, borderRadius: 20 },
  previewContainer: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fafafa" },
  previewItem: { marginRight: 10, position: "relative" },
  previewImage: { width: 70, height: 70, borderRadius: 8 },
  removeBtn: { position: "absolute", top: -5, right: -5, backgroundColor: "#fff", borderRadius: 20 },
  headerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, textAlign: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  headerName: { fontSize: 18, fontWeight: "600" },
  headerRole: { fontSize: 14, color: "#777", fontStyle: "italic" },
  scrollToBottomBtn: { position: "absolute", bottom: 90, right: 20, zIndex: 100 },
  recalled: { fontSize: 14, color: "#999", fontStyle: "italic" },
  actionOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionMenu: {
    width: "70%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
  },
  actionItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  actionText: { fontSize: 15, textAlign: "center" },
  actionCancel: { padding: 14 },
});
