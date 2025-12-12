import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getStatusAppointmentLabel } from "../utils/getStatusLabel";

interface Props {
  visible: boolean;
  data: any;
  onClose: () => void;
  onAccept: (item: any) => void;
  onReject: (item: any) => void;
  onEdit: () => void;
  loading?: boolean;
}

export default function AppointmentDetailModal({
  visible,
  data,
  onClose,
  onAccept,
  onReject,
  onEdit,
  loading,
}: Props) {
  if (!data) return null;
  const { label, color } = getStatusAppointmentLabel(data.status);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.box}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.sub}>Nội dung: {data.content || "—"}</Text>
          <Text style={styles.sub}>Địa điểm: {data.location || "Chưa rõ"}</Text>
          <Text style={styles.sub}>
            Thời gian:{" "}
            {new Date(data.start_time).toLocaleString("vi-VN")} →{" "}
            {new Date(data.end_time).toLocaleString("vi-VN")}
          </Text>
          <Text style={[styles.sub, { color }]}>Trạng thái: {label}</Text>

          <View style={styles.actions}>
            {data.from === "lecturer" && data.status === "pending" && (
              <>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => onAccept(data)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-done-outline"
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.btnText}>Chấp nhận</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => onReject(data)}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="close-circle-outline"
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.btnText}>Từ chối</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {data.from === "parent" && data.status === "pending" && (
              <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.btnText}>Chỉnh sửa</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  sub: { fontSize: 14, color: "#374151", marginTop: 4 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  acceptBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  rejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  btnText: { color: "#fff", marginLeft: 4, fontWeight: "500" },
});
