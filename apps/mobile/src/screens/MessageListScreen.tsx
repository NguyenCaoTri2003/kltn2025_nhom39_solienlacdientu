import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMessageContext } from "../context/MessageProvider";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";
import { getRoleLabel } from "../utils/roleHelper";
import HeaderBar from "../components/HeaderBar";

export default function MessageListScreen() {
  const { conversations, loading, refresh } = useMessageContext();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const myId = user?.id;

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  function formatLastMessage(lastMessage: any, myId?: number, partnerName?: string, previousMessage?: any) {
    if (!lastMessage) return "Chưa có tin nhắn";

    const senderLabel = lastMessage.sender_id === myId ? "Bạn" : partnerName || "Người khác";

    if (lastMessage.is_recalled) return `${senderLabel}: Tin nhắn đã được thu hồi`;

    // Nếu tin nhắn bị xóa bởi tôi
    if (lastMessage.deleted_by?.includes(myId)) {
      if (previousMessage) {
        return formatLastMessage(previousMessage, myId, partnerName);
      }
      return "Chưa có tin nhắn";
    }

    console.log("Last message:", lastMessage);


    switch (lastMessage.type) {
      case "text":
        return `${senderLabel}: ${lastMessage.content}`;
      case "image":
        return `${senderLabel}: Đã gửi 1 ảnh`;
      case "file":
        return `${senderLabel}: Đã gửi 1 tệp`;
      default:
        return `${senderLabel}: Tin nhắn mới`;
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Hộp thư đến" unShowOnBack />

      <FlatList
        data={[...conversations].sort(
          (a, b) =>
            new Date(b.lastMessage?.created_at ?? 0).getTime() -
            new Date(a.lastMessage?.created_at ?? 0).getTime()
        )}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={refresh}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const partner = item.user1?.id === myId ? item.user2 : item.user1;
          const lastMsgTime = item.lastMessage?.created_at
            ? dayjs(item.lastMessage.created_at).format("HH:mm")
            : "";

          let previousMessage = undefined;
          if (item.messages && item.lastMessage?.deleted_by?.includes(myId)) {
            const visibleMessages = item.messages.filter(
              (m: any) => !m.deleted_by?.includes(myId) && !m.is_recalled
            );
            previousMessage = visibleMessages[visibleMessages.length - 1];
          }

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.conversationItem}
              onPress={() =>
                navigation.navigate("Chat", {
                  conversationId: item.id,
                  receiverId: partner?.id,
                  receiverName: partner?.full_name,
                  receiverRole: partner?.role,
                })
              }
            >
              <View style={styles.avatarWrapper}>
                <Image
                  source={{
                    uri:
                      partner?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        partner?.full_name?.trim().split(" ").pop()?.charAt(0).toUpperCase() || "U"
                      )
                      }&background=1E3A8A&color=fff&size=128`,
                  }}
                  style={styles.avatar}
                />
              </View>

              {/* Nội dung */}
              <View style={styles.messageContent}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {partner?.full_name}
                  </Text>
                  <Text style={styles.time}>{lastMsgTime}</Text>
                </View>

                <Text style={styles.role} numberOfLines={1}>
                  {getRoleLabel(partner?.role)}
                </Text>

                <View style={styles.lastMsgRow}>
                  <Text style={styles.lastMsg} numberOfLines={1}>
                    {formatLastMessage(item.lastMessage, myId, partner?.full_name, previousMessage)}
                  </Text>
                  {(item.unreadCount ?? 0) > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        {item.unreadCount ?? 0}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  messageContent: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flexShrink: 1,
  },
  time: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 6,
  },
  role: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  lastMsgRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  lastMsg: {
    flex: 1,
    color: "#4B5563",
    fontSize: 14,
  },
  unreadBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
});
