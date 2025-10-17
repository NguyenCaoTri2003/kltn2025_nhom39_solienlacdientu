import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

export default function StudentHomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Xin chào 👋</Text>
        <Text style={styles.subtitle}>{user?.full_name || "User"}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Điểm học tập</Text>
          <Text>Toán: 8.5</Text>
          <Text>Lý: 7.8</Text>
          <Text>Hóa: 9.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông báo từ giáo viên</Text>
          <Text>- Cần nộp bài tập về nhà môn Toán Cao cấp trước thứ 6.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E6F0FA", // giữ màu nền đồng bộ
  },
  container: {
    padding: 20,
    backgroundColor: "#E6F0FA",
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#005BAC",
  },
  subtitle: {
    fontSize: 18,
    color: "#1E3A8A",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#005BAC",
    marginBottom: 6,
  },
});
