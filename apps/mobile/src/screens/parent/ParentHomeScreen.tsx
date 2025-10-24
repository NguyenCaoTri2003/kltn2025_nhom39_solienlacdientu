import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  Calendar,
  BarChart,
  BookOpen,
  Users,
  DollarSign,
  ClipboardList,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../context/UserContext";
import { useNotificationContext } from "../../context/NotificationContext";

export default function ParentHomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { userData } = useUser();
  const { unreadCount } = useNotificationContext();

  const hours = new Date().getHours();
  const greeting =
    hours < 12
      ? "Chào buổi sáng ☀️"
      : hours < 18
        ? "Chào buổi chiều 🌤️"
        : "Chào buổi tối 🌙";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{user?.full_name || "Phụ huynh"}</Text>
          </View>

          <TouchableOpacity 
            style={styles.notifyBtn}
            onPress={() => navigation.navigate("Notifications" as never)}
          >
            <Bell color="#1E3A8A" size={24} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri:
                user?.avatar_url ||
                "https://cdn-icons-png.flaticon.com/512/2922/2922510.png",
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.profileName}>{user?.full_name || "Phụ huynh"}</Text>
            <Text style={styles.profileCode}>
              Số điện thoại: {user?.phone || "Chưa có số điện thoại"}
            </Text>
          </View>
        </View>

        {/* Child Info Section */}
        <View style={styles.childCard}>
          <Text style={styles.childTitle}>Con của bạn:</Text>

          {userData?.children && userData.children.length > 0 ? (
            userData.children.map((child, index) => (
              <View key={index} style={styles.childItem}>
                <Text style={styles.childInfo}>
                  {child.users?.full_name} - {child.student_code}
                </Text>
                <Text style={styles.childInfo}>
                  Lớp: {child.classes?.class_code || "Chưa có lớp"}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.childInfo}>Chưa có thông tin con.</Text>
          )}
        </View>

        {/* Feature Section */}
        <Text style={styles.sectionTitle}>Tính năng nổi bật</Text>

        <View style={styles.featureGrid}>
          <FeatureButton
            icon={<BarChart color="#2563EB" size={28} />}
            label="Kết quả học tập"
            onPress={() => navigation.navigate("Grades" as never)}
          />
          <FeatureButton
            icon={<Calendar color="#2563EB" size={28} />}
            label="Lịch học"
            onPress={() => navigation.navigate("Schedule" as never)}
          />
          <FeatureButton
            icon={<ClipboardList color="#2563EB" size={28} />}
            label="Điểm danh"
            onPress={() => navigation.navigate("Attendance" as never)}
          />
          <FeatureButton
            icon={<Users color="#2563EB" size={28} />}
            label="Lớp học phần"
            onPress={() => navigation.navigate("CourseOffering" as never)}
          />
          <FeatureButton
            icon={<DollarSign color="#2563EB" size={28} />}
            label="Học phí"
            onPress={() => navigation.navigate("Tuition" as never)}
          />
          <FeatureButton
            icon={<BookOpen color="#2563EB" size={28} />}
            label="Thông báo"
            onPress={() => navigation.navigate("Notifications" as never)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.featureButton} onPress={onPress}>
      <View style={styles.iconWrapper}>{icon}</View>
      <Text style={styles.featureLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    paddingBottom: 40,
  },

  /** Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  name: {
    fontSize: 16,
    color: "#6B7280",
  },
  notifyBtn: {
    backgroundColor: "#F3F4F6",
    padding: 10,
    borderRadius: 14,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  /** Profile Card */
  profileCard: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  profileCode: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 4,
  },

  /** Child Info */
  childCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  childTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
    marginBottom: 6,
  },
  childInfo: {
    fontSize: 15,
    color: "#1E3A8A",
    marginBottom: 2,
  },
  childItem: {
    marginBottom: 8,
  },


  /** Feature Section */
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  featureButton: {
    width: "47%",
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    paddingVertical: 22,
    marginBottom: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconWrapper: {
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1E3A8A",
  },
});
