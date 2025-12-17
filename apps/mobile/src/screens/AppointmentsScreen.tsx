import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useAppointment } from "../hooks/useAppointment";
import HeaderBar from "../components/HeaderBar";
import LoadingScreen from "../components/LoadingScreen";
import AppointmentEditModal from "../components/AppointmentEditModal";
import AppointmentDetailModal from "../components/AppointmentDetailModal";
import { getStatusAppointmentLabel } from "../utils/getStatusLabel";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { conversationService } from "../services/conversationService";
import { useMessageContext } from "../context/MessageProvider";

export default function AppointmentsScreen() {
  const { token } = useAuth();
  const { appointments, fetchAppointments, updateAppointment, loading } =
    useAppointment(token || undefined);

  const [selected, setSelected] = useState<any>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  const { refresh } = useMessageContext();

  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const handleOpenChat = async (
    receiverId: number,
    receiverName: string,
    receiverRole?: string
  ) => {
    try {
      if (!token) {
        alert("Bạn cần đăng nhập để nhắn tin.");
        return;
      }
      if (!receiverId) {
        alert("Không tìm được thông tin người nhận.");
        return;
      }

      const conv = await conversationService.getOrCreateConversation(
        token,
        receiverId
      );
      const conversationId = conv.conversation_id || conv.id;

      // Cập nhật lại danh sách hội thoại
      refresh?.();

      navigation.navigate("Messages" as never, {
        screen: "Chat",
        params: {
          conversationId,
          receiverId,
          receiverName,
          receiverRole,
        },
      } as never);
    } catch (error) {
      console.error("Open chat from appointment error:", error);
      alert("Không thể mở khung chat. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const handleUpdateAppointment = async (updated: any) => {
    if (!selected) return;
    try {
      setActionLoading(true);
      await updateAppointment(selected.id, updated);
      alert("Cập nhật lịch hẹn thành công!");
      setEditVisible(false);
      setDetailVisible(false);
      fetchAppointments();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptAppointment = async (item: any) => {
    try {
      setActionLoading(true);
      await updateAppointment(item.id, { status: "confirmed" });
      alert("Đã chấp nhận lịch hẹn!");
      fetchAppointments();
      setDetailVisible(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectAppointment = async (item: any) => {
    try {
      setActionLoading(true);
      await updateAppointment(item.id, { status: "cancelled" });
      alert("Đã từ chối lịch hẹn!");
      fetchAppointments();
      setDetailVisible(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((item) => {
    const q = searchText.toLowerCase().trim();
    const lecturer = item?.lecturer?.users?.full_name?.toLowerCase() || "";
    const student = item?.student?.users?.full_name?.toLowerCase() || "";
    const title = item?.title?.toLowerCase() || "";
    const note = item?.note?.toLowerCase() || "";
    const dateStr = new Date(item.start_time)
      .toLocaleDateString("vi-VN")
      .toLowerCase();

    if (q) {
      const match =
        title.includes(q) ||
        lecturer.includes(q) ||
        student.includes(q) ||
        note.includes(q) ||
        dateStr.includes(q);

      if (!match) return false;
    }

    if (selectedDate) {
      const day = new Date(item.start_time).toLocaleDateString("vi-VN");
      const selectedDay = selectedDate.toLocaleDateString("vi-VN");
      if (day !== selectedDay) return false;
    }

    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <HeaderBar title="Lịch hẹn" />

      {loading ? (
        <LoadingScreen text="Đang tải lịch hẹn..." />
      ) : (
        <>
          {appointments.length > 0 && (
            <>
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={20}
                  color="#6B7280"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm theo tên, giảng viên, sinh viên, ngày..."
                  placeholderTextColor="#9CA3AF"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>

              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setDatePickerVisible(true)}
                >
                  <Ionicons name="calendar" size={20} color="#005BAC" />
                  <Text style={styles.dateButtonText}>
                    {selectedDate
                      ? selectedDate.toLocaleDateString("vi-VN")
                      : "Chọn ngày"}
                  </Text>
                </TouchableOpacity>

                {selectedDate && (
                  <TouchableOpacity
                    onPress={() => setSelectedDate(null)}
                    style={styles.clearDate}
                  >
                    <Ionicons name="close-circle" size={22} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          <ScrollView
            style={styles.container}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {appointments.length === 0 ? (
              <View style={styles.center}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color="#9CA3AF"
                  style={{ marginBottom: 12 }}
                />

                <Text style={{ color: "#6B7280", marginBottom: 12, fontSize: 16 }}>
                  Chưa có lịch hẹn nào.
                </Text>

                <TouchableOpacity
                  style={styles.goButton}
                  onPress={() =>
                    navigation.navigate("Home", { screen: "CourseOffering" })
                  }
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    Đến lớp học phần
                  </Text>
                </TouchableOpacity>
              </View>
            ) : filteredAppointments.length === 0 ? (
              <View style={styles.center}>
                <Ionicons
                  name="search-outline"
                  size={46}
                  color="#9CA3AF"
                  style={{ marginBottom: 10 }}
                />
                <Text style={{ color: "#6B7280", fontSize: 16 }}>
                  Không tìm thấy kết quả phù hợp.
                </Text>
              </View>
            ) : (
              filteredAppointments.map((item) => {
                const { label, color } = getStatusAppointmentLabel(item.status);

                // Với parent: luôn nhắn tin cho giảng viên của lịch hẹn
                const lecturerUser = item.lecturer?.users;
                const lecturerId = item.lecturer?.id;

                return (
                  <View key={item.id} style={styles.card}>
                    <TouchableOpacity
                      onPress={() => {
                        setSelected(item);
                        setDetailVisible(true);
                      }}
                    >
                      <Text style={styles.title}>{item.title}</Text>
                      <Text style={styles.subText}>
                        Giảng viên: {lecturerUser?.full_name || "—"}
                      </Text>
                      <Text style={styles.subText}>
                        Sinh viên: {item.student?.users?.full_name || "—"}
                      </Text>
                      <Text style={styles.subText}>
                        {new Date(item.start_time).toLocaleString("vi-VN")} →{" "}
                        {new Date(item.end_time).toLocaleString("vi-VN")}
                      </Text>

                      <View style={{ flexDirection: "row", marginTop: 4 }}>
                        <Text style={styles.statusLabel}>Trạng thái: </Text>
                        <Text style={[styles.statusText, { color }]}>
                          {label}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Nút nhắn tin ngay trong item lịch hẹn (parent -> giảng viên) */}
                    {lecturerId && (
                      <TouchableOpacity
                        style={styles.chatButton}
                        onPress={() =>
                          handleOpenChat(
                            lecturerId,
                            lecturerUser?.full_name || "Giảng viên",
                            "lecturer"
                          )
                        }
                      >
                        <Text style={styles.chatButtonText}>Nhắn tin</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </>
      )}

      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="date"
        locale="vi"
        onConfirm={(date) => {
          setDatePickerVisible(false);
          setSelectedDate(date);
        }}
        onCancel={() => setDatePickerVisible(false)}
      />

      <AppointmentDetailModal
        visible={detailVisible}
        data={selected}
        onClose={() => setDetailVisible(false)}
        onAccept={handleAcceptAppointment}
        onReject={handleRejectAppointment}
        onEdit={() => {
          setDetailVisible(false);
          setEditVisible(true);
        }}
        loading={actionLoading}
      />

      <AppointmentEditModal
        visible={editVisible}
        data={selected}
        onClose={() => setEditVisible(false)}
        onSubmit={handleUpdateAppointment}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16 },
  center: { alignItems: "center", marginTop: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  title: { fontSize: 16, fontWeight: "600", color: "#111827" },
  subText: { fontSize: 14, color: "#374151", marginTop: 2 },
  statusLabel: { color: "#6B7280", fontSize: 14 },
  statusText: { fontSize: 14, fontWeight: "600" },
  chatButton: {
    marginTop: 10,
    alignSelf: "flex-end",
    backgroundColor: "#005BAC",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  chatButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  goButton: {
    backgroundColor: "#005BAC",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: -4,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
  },
  dateButtonText: {
    marginLeft: 8,
    color: "#111827",
    fontSize: 15,
  },
  clearDate: {
    marginLeft: 10,
  },
});
