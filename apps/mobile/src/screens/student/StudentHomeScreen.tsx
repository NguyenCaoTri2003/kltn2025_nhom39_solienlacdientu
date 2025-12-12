import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import {
  Bell,
  Calendar,
  BarChart,
  BookOpen,
  Users,
  DollarSign,
  ClipboardList,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../context/UserContext";
import { useNotificationContext } from "../../context/NotificationContext";
import { getTodayClasses } from "../../services/scheduleService";

export default function StudentHomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { userData, loading } = useUser();
  const { unreadCount } = useNotificationContext();

  console.log("User Data in StudentHomeScreen:", userData);

  const [todayClasses, setTodayClasses] = useState([]);
  const [loadingToday, setLoadingToday] = useState(false);

  const hours = new Date().getHours();
  const greeting =
    hours < 12
      ? "Chào buổi sáng ☀️"
      : hours < 18
        ? "Chào buổi chiều 🌤️"
        : "Chào buổi tối 🌙";

  useEffect(() => {
    if (!userData?.id) return;

    async function loadToday() {
      setLoadingToday(true);
      const data = await getTodayClasses(
        String(userData?.id)
      );
      setTodayClasses(data);
      setLoadingToday(false);
    }

    loadToday();
  }, [userData]);

  function getBadgeStyle(type: string) {
    switch (type) {
      case "theory":
        return { backgroundColor: "#DBEAFE" }; 
      case "practice":
        return { backgroundColor: "#DCFCE7" };
      case "exam":
        return { backgroundColor: "#FEF3C7" }; 
      default:
        return { backgroundColor: "#E5E7EB" };
    }
  }

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
            <Text style={styles.name}>{user?.full_name || "Sinh viên"}</Text>
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
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.profileName}>{user?.full_name || "User"}</Text>
            {loading ? (
              <Text style={[styles.profileCode, { color: "#9CA3AF" }]}>
                Đang tải mã sinh viên...
              </Text>
            ) : (
              <Text style={styles.profileCode}>
                Mã SV: {userData?.student?.student_code || "Chưa có mã sinh viên"}
              </Text>
            )}
          </View>
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
            icon={<ClipboardList color="#2563EB" size={28} />}
            label="Điểm danh"
            onPress={() => navigation.navigate("Attendance" as never)}
          />
        </View>

        <Text style={styles.sectionTitle}>Lịch học hôm nay</Text>

        {todayClasses
          .sort((a: any, b: any) => a.start_period - b.start_period)
          .map((item: any) => (
            <View key={item.id} style={styles.classCard}>
              {/* Header row */}
              <View style={styles.rowBetween}>
                <Text style={styles.subjectName}>{item?.course_offering?.name}</Text>

                <View style={[styles.badgeClassToday, getBadgeStyle(item.type)]}>
                  <Text style={styles.badgeTextClassToday}>
                    {item?.type === "theory"
                      ? "Lý thuyết"
                      : item?.type === "practice"
                        ? "Thực hành"
                        : item?.type === "exam"
                          ? "Lịch thi"
                          : "Khác"}
                  </Text>
                </View>
              </View>

              {/* Class + class code */}
              <Text style={styles.classInfo}>
                {item?.course_offering?.class?.name} - {item?.course_offering?.class_code}
              </Text>

              {/* Period */}
              <Text style={styles.period}>
                Tiết: {item?.start_period} - {item?.start_period + item?.period_count - 1}
              </Text>

              {/* Lecturer */}
              <Text style={styles.lecturer}>
                GV: {item?.course_offering?.lecturers?.users?.full_name}
              </Text>
            </View>
          ))}

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
  classCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  subjectName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
  },

  classInfo: {
    marginTop: 6,
    fontSize: 14,
    color: "#374151",
  },

  period: {
    marginTop: 6,
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },

  lecturer: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
  },

  badgeClassToday: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  badgeTextClassToday: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E3A8A",
  },
});
