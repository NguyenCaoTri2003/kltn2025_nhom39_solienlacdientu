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

export default function StudentHomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

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
            <Text style={styles.name}>{user?.full_name || "Sinh viên"}</Text>
          </View>

          <TouchableOpacity style={styles.notifyBtn}>
            <Bell color="#1E3A8A" size={24} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri:
                user?.avatar ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.profileName}>{user?.full_name || "User"}</Text>
            <Text style={styles.profileCode}>
              Mã SV: {user?.student_code || "20210001"}
            </Text>
          </View>
        </View>

        {/* Feature Section */}
        <Text style={styles.sectionTitle}>Tính năng nổi bật</Text>

        <View style={styles.featureGrid}>
          <FeatureButton 
            icon={<Calendar color="#2563EB" 
            size={28} />} 
            label="Lịch học" 
            onPress={() => navigation.navigate("Schedule" as never)}
          />
          <FeatureButton
            icon={<BarChart color="#2563EB" size={28} />}
            label="Kết quả học tập"
            onPress={() =>
              navigation.navigate("Grades", { studentId: user!.id }) as never
            }
          />
          <FeatureButton
            icon={<Users color="#2563EB" size={28} />}
            label="Lớp học phần"
            onPress={() => navigation.navigate("CourseOffering" as never)}
          />
          <FeatureButton icon={<DollarSign color="#2563EB" size={28} />} label="Học phí" />
          <FeatureButton icon={<ClipboardList color="#2563EB" size={28} />} label="Điểm danh" />
          <FeatureButton icon={<BookOpen color="#2563EB" size={28} />} label="Khảo sát" />
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
