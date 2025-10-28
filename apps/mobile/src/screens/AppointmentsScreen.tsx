import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useAppointment } from "../hooks/useAppointment";
import HeaderBar from "../components/HeaderBar";
import LoadingScreen from "../components/LoadingScreen";
import AppointmentEditModal from "../components/AppointmentEditModal";
import AppointmentDetailModal from "../components/AppointmentDetailModal";
import { getStatusAppointmentLabel } from "../utils/getStatusLabel";

export default function AppointmentsScreen() {
  const { token } = useAuth();
  const { appointments, fetchAppointments, updateAppointment, loading } =
    useAppointment(token || undefined);

  const [selected, setSelected] = useState<any>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

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

  return (
    <SafeAreaView style={styles.safe}>
      <HeaderBar title="Lịch hẹn" />

      {loading ? (
        <LoadingScreen text="Đang tải lịch hẹn..." />
      ) : (
        <ScrollView style={styles.container}>
          {appointments.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ color: "#6B7280" }}>Chưa có lịch hẹn nào.</Text>
            </View>
          ) : (
            appointments.map((item) => {
              const { label, color } = getStatusAppointmentLabel(item.status);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => {
                    setSelected(item);
                    setDetailVisible(true);
                  }}
                >
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.subText}>
                    Giảng viên: {item.lecturer?.users?.full_name || "—"}
                  </Text>
                  <Text style={styles.subText}>
                    {new Date(item.start_time).toLocaleString("vi-VN")} →{" "}
                    {new Date(item.end_time).toLocaleString("vi-VN")}
                  </Text>
                  <View style={{ flexDirection: "row", marginTop: 4 }}>
                    <Text style={styles.statusLabel}>Trạng thái: </Text>
                    <Text style={[styles.statusText, { color }]}>{label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* 📄 Modal chi tiết */}
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

      {/* ✏️ Modal chỉnh sửa */}
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
  center: { alignItems: "center", marginTop: 40 },
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
});
