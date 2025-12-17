import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Calendar, Clock, MapPin, X, Check } from "lucide-react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    start_time: string;
    end_time: string;
    location?: string;
  }) => void;
}

export default function AppointmentCreateModal({ visible, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");

  const [date, setDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [pickerType, setPickerType] = useState<"date" | "start" | "end" | null>(null);

  const handleConfirm = () => {
    if (!title.trim()) return Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề.");
    if (!date || !startTime || !endTime)
      return Alert.alert("Thiếu thông tin", "Vui lòng chọn đầy đủ ngày và giờ.");

    const startDateTime = new Date(date);
    startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0);

    const now = new Date();
    if (startDateTime <= now)
      return Alert.alert("Lỗi thời gian", "Thời gian bắt đầu phải sau hiện tại.");
    if (endDateTime <= startDateTime)
      return Alert.alert("Lỗi thời gian", "Thời gian kết thúc phải sau giờ bắt đầu.");

    onSubmit({
      title,
      content,
      location,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
    });
    onClose();
  };

  const handlePickerConfirm = (datePicked: Date) => {
    if (pickerType === "date") setDate(datePicked);
    else if (pickerType === "start") setStartTime(datePicked);
    else if (pickerType === "end") setEndTime(datePicked);
    setPickerType(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.header}>Tạo lịch hẹn</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            <View style={styles.field}>
              <Text style={styles.label}>Tiêu đề *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tiêu đề lịch hẹn"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nội dung</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Mô tả ngắn nội dung buổi hẹn (không bắt buộc)"
                multiline
                value={content}
                onChangeText={setContent}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Địa điểm</Text>
              <View style={styles.iconInput}>
                <MapPin size={18} color="#007AFF" style={{ marginRight: 6 }} />
                <TextInput
                  style={{ flex: 1 }}
                  placeholder="Ví dụ: Phòng B201, online, ..."
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Date & Time Pickers */}
            <View style={styles.field}>
              <Text style={styles.label}>Ngày hẹn *</Text>
              <TouchableOpacity
                style={styles.iconInput}
                onPress={() => setPickerType("date")}
              >
                <Calendar size={18} color="#007AFF" style={{ marginRight: 6 }} />
                <Text style={{ flex: 1, color: date ? "#111827" : "#9CA3AF" }}>
                  {date ? date.toLocaleDateString("vi-VN") : "Chọn ngày"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Giờ bắt đầu *</Text>
              <TouchableOpacity
                style={styles.iconInput}
                onPress={() => setPickerType("start")}
              >
                <Clock size={18} color="#007AFF" style={{ marginRight: 6 }} />
                <Text style={{ flex: 1, color: startTime ? "#111827" : "#9CA3AF" }}>
                  {startTime ? startTime.toLocaleTimeString("vi-VN") : "Chọn giờ bắt đầu"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Giờ kết thúc *</Text>
              <TouchableOpacity
                style={styles.iconInput}
                onPress={() => setPickerType("end")}
              >
                <Clock size={18} color="#007AFF" style={{ marginRight: 6 }} />
                <Text style={{ flex: 1, color: endTime ? "#111827" : "#9CA3AF" }}>
                  {endTime ? endTime.toLocaleTimeString("vi-VN") : "Chọn giờ kết thúc"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Modal Datetime Picker */}
            <DateTimePickerModal
              isVisible={pickerType !== null}
              mode={pickerType === "date" ? "date" : "time"}
              is24Hour
              onConfirm={handlePickerConfirm}
              onCancel={() => setPickerType(null)}
              locale="vi_VN"
            />
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={{ color: "#374151" }}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleConfirm}>
              <Check size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={{ color: "#fff", fontWeight: "600" }}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    maxHeight: "85%",
  },
  scroll: {
    maxHeight: "100%",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  header: { fontSize: 18, fontWeight: "700" },
  field: {
    marginVertical: 4,
  },
  label: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 10,
    marginVertical: 5,
  },
  iconInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 10,
    marginVertical: 5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
});
