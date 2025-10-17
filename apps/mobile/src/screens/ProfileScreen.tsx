import React from "react";
import { Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; 
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <Text style={styles.title}>Thông tin tài khoản</Text>
      <Text>Họ tên: {user?.full_name || "Chưa có"}</Text>
      <Text>Vai trò: {user?.role === "student" ? "Sinh viên" : "Phụ huynh"}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#E6F0FA",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#005BAC",
    marginBottom: 12,
  },
});
