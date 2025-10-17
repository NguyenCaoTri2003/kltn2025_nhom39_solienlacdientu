import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Xin chào {user?.full_name || "User"} 👋</Text>
      <TouchableOpacity
        onPress={logout}
        style={{ backgroundColor: "red", padding: 12, borderRadius: 8 }}
      >
        <Text style={{ color: "white" }}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  );
}
