import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { ChevronRight } from "lucide-react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      {/* Header xanh đậm */}
      <View style={styles.header}>
        <Text style={styles.headerText}>THÔNG TIN</Text>
      </View>

      {/* Card trắng với bo góc trên */}
      <View style={styles.card}>
        {/* Nhóm 1: Tài khoản */}
        <Text style={styles.sectionTitle}>Tài khoản</Text>

        <TouchableOpacity style={styles.item}>
          <MaterialIcons name="person-outline" size={22} color="#1E88E5" />
          <Text style={styles.itemText}>Thông tin cá nhân</Text>
          <ChevronRight size={20} color="#BDBDBD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <FontAwesome5 name="lock" size={20} color="#E53935" />
          <Text style={styles.itemText}>Đổi mật khẩu</Text>
          <ChevronRight size={20} color="#BDBDBD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <MaterialIcons name="logout" size={22} color="#FBC02D" />
          <Text style={styles.itemText}>Đăng xuất</Text>
          <ChevronRight size={20} color="#BDBDBD" />
        </TouchableOpacity>
      </View>

      {/* Thông tin chung ở cuối */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Được phát triển bởi Nhóm 36</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#005BAC",
    paddingTop: 80,
    paddingBottom: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#424242",
    marginBottom: 12,
    fontWeight: "600",
    marginTop: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 25,
    borderBottomWidth: 0.5,
    borderColor: "#E0E0E0",
    justifyContent: "space-between",
  },
  itemText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#212121",
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 15,
    color: "#616161",
  },
  infoValue: {
    fontSize: 15,
    color: "#212121",
    fontWeight: "500",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    borderTopWidth: 0.5,
    borderColor: "#E0E0E0",
  },
  footerText: {
    fontSize: 14,
    color: "#616161",
  },
});
