import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";

export default function ParentHomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Xin chào {user?.full_name || "Phụ huynh"}</Text>
        <Text style={styles.subtitle}>Theo dõi thông tin học tập của con</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tình hình học tập</Text>
          <Text>- Sinh viên: Nguyễn Minh An (Lớp 10A1)</Text>
          <Text>- Trung bình học kỳ: 8.2</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông báo từ nhà trường</Text>
          <Text>- Họp phụ huynh dự kiến ngày 22/10.</Text>
          <Text>- Sinh viên cần hoàn thành bài thi giữa kỳ.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#E6F0FA",
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
