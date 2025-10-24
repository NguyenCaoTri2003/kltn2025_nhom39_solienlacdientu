import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMessageContext } from "../context/MessageProvider";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";

export default function MessageListScreen() {
  const { conversations, loading, refresh } = useMessageContext();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const myId = user?.id;

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Hộp thư đến</Text>
      <FlatList
        data={[...conversations].sort(
          (a, b) =>
            new Date(b.lastMessage?.created_at ?? 0).getTime() -
            new Date(a.lastMessage?.created_at ?? 0).getTime()
        )}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={refresh}
        renderItem={({ item }) => {
          const partner = item.user1?.id === myId ? item.user2 : item.user1;
          const lastMsgTime = item.lastMessage?.created_at
            ? dayjs(item.lastMessage.created_at).format("HH:mm")
            : "";

          return (
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() =>
                navigation.navigate("Chat", {
                  conversationId: item.id,
                  receiverId: partner?.id,
                  receiverName: partner?.full_name,
                })
              }
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{partner?.full_name}</Text>
                <Text style={styles.lastMsg} numberOfLines={1}>
                  {item.lastMessage?.content || "Chưa có tin nhắn"}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.time}>{lastMsgTime}</Text>
                {(item.unreadCount ?? 0) > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>
                      {item.unreadCount ?? 0}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  conversationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  name: { fontSize: 16, fontWeight: "500" },
  lastMsg: { color: "#888", marginTop: 4 },
  unreadBadge: {
    backgroundColor: "#f00",
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { color: "#fff", fontWeight: "bold", paddingHorizontal: 6 },
  time: { fontSize: 12, color: "#888", marginBottom: 4 },
});
