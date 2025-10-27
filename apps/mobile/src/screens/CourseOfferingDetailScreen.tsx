import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NavigationProp, NavigatorScreenParams } from "@react-navigation/native";
import LoadingScreen from "../components/LoadingScreen";
import HeaderBar from "../components/HeaderBar";
import { fetchOfferingDetail } from "../services/offeringService";
import { getStatusLabel } from "../utils/getStatusLabel";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import { conversationService } from "../services/conversationService";
import { useAppointment } from "../hooks/useAppointment";
import AppointmentCreateModal from "../components/AppointmentCreateModal";

export default function CourseOfferingDetailScreen() {
  const route = useRoute();
  const { id, studentId: routeStudentId } = route.params as {
    id: number;
    studentId?: number;
  };
  type MessagesParams = {
    Chat: {
      conversationId: number | string;
      receiverId: number;
      receiverName?: string;
      receiverRole?: string;
    };
  };

  type RootStackParamList = {
    Messages: NavigatorScreenParams<MessagesParams>;
  };

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { userData } = useUser();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const { createAppointment, loading: creating } = useAppointment(token || undefined);

  console.log("Offering detail data:", data);

  const studentId =
    userData?.role === "student"
      ? userData.student?.id
      : routeStudentId || userData?.children?.[0]?.id;

  useEffect(() => {
    (async () => {
      try {
        const detail = await fetchOfferingDetail(id, studentId);
        setData(detail);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, studentId]);

  const handleChat = async (receiverId: number, receiverName: string) => {
    try {
      if (!token) return alert("Chưa đăng nhập!");

      const conv = await conversationService.getOrCreateConversation(token, receiverId);
      const conversationId = conv.conversation_id || conv.id;

      navigation.navigate("Messages", {
        screen: "Chat",
        params: { conversationId, receiverId, receiverName: receiverName, receiverRole: "lecturer" },
      });
    } catch (err) {
      console.error("Chat error:", err);
      alert("Không thể mở cuộc trò chuyện.");
    }
  };

  const dayNames = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <HeaderBar title="Chi tiết lớp học phần" />

      {loading ? (
        <LoadingScreen text="Đang tải chi tiết lớp học phần..." />
      ) : !data ? (
        <View style={styles.center}>
          <Text>Không tìm thấy thông tin lớp học phần.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>

          <View style={styles.headerBox}>
            <Text style={styles.header}>{data.name}</Text>
            <Text style={styles.sub}>
              {data.class_code} - {data.semester.name} (
              {data.semester.academic_year})
            </Text>
            <Text style={styles.status}>
              Trạng thái:{" "}
              {(() => {
                const { label, color } = getStatusLabel(data.status);
                return (
                  <Text style={[styles.statusValue, { color }]}>{label}</Text>
                );
              })()}
            </Text>
          </View>

          {new Date(data.semester.end_date) < new Date() && (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
              <Text style={styles.warningText}>
                Lớp học phần này không còn trong học kỳ hiện tại.
              </Text>
            </View>
          )}

          <View style={styles.infoBox}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#007AFF"
              />
              <Text style={styles.sectionTitle}>Thông tin lớp học phần</Text>
            </View>
            <Text style={styles.infoItem}>Số tín chỉ: {data.course.credit}</Text>
            <Text style={styles.infoItem}>
              Học phí:{" "}
              {data.course.tuition_fee
                ? `${data.course.tuition_fee.toLocaleString("vi-VN")}₫`
                : "Chưa cập nhật"}
            </Text>
            <Text style={styles.infoItem}>
              Sĩ số: {data.registered}/{data.capacity}
            </Text>
            {data.description && (
              <Text style={styles.infoItem}>Mô tả: {data.description}</Text>
            )}
            <Text style={styles.infoItem}>
              Thời gian học:{" "}
              {new Date(data.semester.start_date).toLocaleDateString("vi-VN")} -{" "}
              {new Date(data.semester.end_date).toLocaleDateString("vi-VN")}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="school-outline" size={22} color="#007AFF" />
              <Text style={[styles.sectionTitle, { color: "#007AFF" }]}>Giảng viên lý thuyết</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.infoName}>{data.lecturer.full_name}</Text>
              <Text style={styles.email}>{data.lecturer.email}</Text>

              {new Date(data.semester.end_date) >= new Date() && (
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleChat(data.lecturer.id, data.lecturer.full_name)}
                  >
                    <Ionicons
                      name="chatbubble-ellipses-outline"
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.buttonText}> Nhắn tin</Text>
                  </TouchableOpacity>

                  {userData?.role === "parent" && (
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => setModalVisible(true)}
                    >
                      <Ionicons name="calendar-outline" size={16} color="#fff" />
                      <Text style={styles.buttonText}> Đặt lịch hẹn</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <Text style={styles.sectionSubtitle}>Lịch học lý thuyết</Text>
              {data.schedule.length > 0 ? (
                data.schedule.map((s: any) => (
                  <Text key={s.id} style={styles.schedule}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />{" "}
                    {dayNames[s.day_of_week]} - {s.building}
                    {s.classroom ? `.${s.classroom}` : ""} - Tiết{" "}
                    {s.start_period} -{" "}
                    {s.start_period + s.period_count - 1}
                  </Text>
                ))
              ) : (
                <Text style={styles.noSchedule}>Không có lịch học.</Text>
              )}
            </View>
          </View>

          {data.practice_group && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flask-outline" size={22} color="#10B981" />
                <Text
                  style={[styles.sectionTitle, { color: "#065F46" }]}
                >
                  Giảng viên thực hành
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.infoName}>
                  {data.practice_group.lecturer.full_name}
                </Text>
                <Text style={styles.email}>
                  {data.practice_group.lecturer.email}
                </Text>

                <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
                  <Ionicons name="people-outline" size={16} color="#4B5563" />
                  <Text style={styles.infoItem}>
                    Nhóm: {data.practice_group.group_number} | Sĩ số:{" "}
                    {data.practice_group.registered}/
                    {data.practice_group.capacity}
                  </Text>
                </View>

                {new Date(data.semester.end_date) >= new Date() && (
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TouchableOpacity
                      style={[
                        styles.button,
                        { backgroundColor: "#10B981" },
                      ]}
                      onPress={() => handleChat(data.practice_group.lecturer.id, data.practice_group.lecturer.full_name)}
                    >
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.buttonText}> Nhắn tin</Text>
                    </TouchableOpacity>

                    {userData?.role === "parent" && (
                      <TouchableOpacity
                        style={[
                          styles.button,
                          { backgroundColor: "#10B981" },
                        ]}
                        onPress={() => setModalVisible(true)}
                      >
                        <Ionicons name="calendar-outline" size={16} color="#fff" />
                        <Text style={styles.buttonText}> Đặt lịch hẹn</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <Text style={styles.sectionSubtitle}>Lịch học thực hành</Text>
                {data.practice_group.schedule.length > 0 ? (
                  data.practice_group.schedule.map((s: any) => (
                    <Text key={s.id} style={styles.schedule}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#6B7280"
                      />{" "}
                      {dayNames[s.day_of_week]} - {s.building}
                      {s.classroom ? `.${s.classroom}` : ""} - Tiết{" "}
                      {s.start_period} -{" "}
                      {s.start_period + s.period_count - 1}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.noSchedule}>Không có lịch học.</Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}
      <AppointmentCreateModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={async (form) => {
          try {
            await createAppointment({
              ...form,
              studentId,
              lecturerId: data.lecturer.id,
            });
            alert("Đã gửi yêu cầu đặt lịch thành công!");
            setModalVisible(false);
            navigation.navigate("Appointments");
          } catch (e: any) {
            alert(e.message);
            console.log(e);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 16, paddingBottom: 40 },
  headerBox: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  header: { fontSize: 22, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 15, color: "#6B7280", marginTop: 4 },
  status: { fontSize: 15, color: "#444", marginTop: 6 },
  statusValue: { fontWeight: "600", textTransform: "capitalize" },
  infoBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  section: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 8,
    marginBottom: 4,
  },
  infoItem: { fontSize: 15, color: "#374151" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  email: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 6,
    maxWidth: "95%",
    lineHeight: 18,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  buttonText: { color: "#fff", fontWeight: "500" },
  schedule: { fontSize: 14, color: "#374151", marginTop: 2 },
  noSchedule: { fontSize: 14, color: "#9CA3AF" },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  warningText: {
    color: "#B91C1C",
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
    flexWrap: "wrap",
  },
});
