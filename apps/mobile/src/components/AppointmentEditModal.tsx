import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Calendar, Clock, MapPin, X, Check } from "lucide-react-native";

interface Props {
  visible: boolean;
  data: any;
  onClose: () => void;
  onSubmit: (updated: {
    title: string;
    content: string;
    start_time: string;
    end_time: string;
    location?: string;
  }) => void;
}

export default function AppointmentEditModal({
  visible,
  data,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "start" | "end" | null>(
    null
  );

  useEffect(() => {
    if (data) {
      setTitle(data.title || "");
      setContent(data.content || "");
      setLocation(data.location || "");

      const s = new Date(data.start_time);
      const e = new Date(data.end_time);
      setDate(new Date(s));
      setStartTime(new Date(s));
      setEndTime(new Date(e));
    }
  }, [data, visible]);

  const handleSave = () => {
    if (!title.trim())
      return Alert.alert("Thiếu thông tin", "Vui lòng nhập tiêu đề.");
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
  };

  const openPicker = (type: "date" | "start" | "end") => {
    setPickerMode(type);
    setPickerVisible(true);
  };

  const handleConfirm = (selected: Date) => {
    if (!pickerMode) return;
    setPickerVisible(false);

    if (pickerMode === "date") setDate(selected);
    else if (pickerMode === "start") setStartTime(selected);
    else if (pickerMode === "end") setEndTime(selected);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.headerContainer}>
            <Text style={styles.header}>Chỉnh sửa lịch hẹn</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="* Tiêu đề"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder="Nội dung"
            multiline
            value={content}
            onChangeText={setContent}
          />

          <View style={styles.iconInput}>
            <MapPin size={18} color="#007AFF" style={{ marginRight: 6 }} />
            <TextInput
              style={{ flex: 1 }}
              placeholder="Địa điểm (nếu có)"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <TouchableOpacity
            style={styles.iconInput}
            onPress={() => openPicker("date")}
          >
            <Calendar size={18} color="#007AFF" style={{ marginRight: 6 }} />
            <Text style={{ flex: 1, color: date ? "#111827" : "#9CA3AF" }}>
              {date ? date.toLocaleDateString("vi-VN") : "Chọn ngày"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconInput}
            onPress={() => openPicker("start")}
          >
            <Clock size={18} color="#007AFF" style={{ marginRight: 6 }} />
            <Text style={{ flex: 1, color: startTime ? "#111827" : "#9CA3AF" }}>
              {startTime
                ? startTime.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Giờ bắt đầu"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconInput}
            onPress={() => openPicker("end")}
          >
            <Clock size={18} color="#007AFF" style={{ marginRight: 6 }} />
            <Text style={{ flex: 1, color: endTime ? "#111827" : "#9CA3AF" }}>
              {endTime
                ? endTime.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Giờ kết thúc"}
            </Text>
          </TouchableOpacity>

          <DateTimePickerModal
            isVisible={pickerVisible}
            mode={pickerMode === "date" ? "date" : "time"}
            is24Hour
            onConfirm={handleConfirm}
            onCancel={() => setPickerVisible(false)}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={{ color: "#374151" }}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Check size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={{ color: "#fff", fontWeight: "600" }}>Lưu thay đổi</Text>
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
    padding: 16,
    width: "90%",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  header: { fontSize: 18, fontWeight: "700" },
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
