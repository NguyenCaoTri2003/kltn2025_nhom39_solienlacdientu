import React from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useConversations } from "../hooks/useMessages";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext"; 

export default function MessageListScreen() {
  const { conversations, loading, refresh } = useConversations();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const myId = user?.id;

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Hộp thư đến</Text>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={refresh}
        renderItem={({ item }) => {
        //   const partner = item.user1?.id === item.myId ? item.user2 : item.user1;
        const partner = item.user1?.id === myId ? item.user2 : item.user1;
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
              <View>
                <Text style={styles.name}>{partner?.full_name}</Text>
                <Text style={styles.lastMsg}>{item.lastMessage?.content || "..."}</Text>
              </View>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
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
});
