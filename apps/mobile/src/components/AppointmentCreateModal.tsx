import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

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
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const handleConfirm = () => {
    if (!title || !startTime || !endTime) {
      alert("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }
    onSubmit({
      title,
      content,
      location,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Đặt lịch hẹn với giảng viên</Text>

          <TextInput
            style={styles.input}
            placeholder="Tiêu đề"
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
          <TextInput
            style={styles.input}
            placeholder="Địa điểm (nếu có)"
            value={location}
            onChangeText={setLocation}
          />

          <TouchableOpacity onPress={() => setShowStartPicker(true)}>
            <Text style={styles.timePicker}>
              ⏰ Bắt đầu: {startTime ? startTime.toLocaleString("vi-VN") : "Chọn thời gian"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowEndPicker(true)}>
            <Text style={styles.timePicker}>
              🕒 Kết thúc: {endTime ? endTime.toLocaleString("vi-VN") : "Chọn thời gian"}
            </Text>
          </TouchableOpacity>

          {showStartPicker && (
            <DateTimePicker
              value={startTime || new Date()}
              mode="datetime"
              onChange={(_, date) => {
                setShowStartPicker(false);
                if (date) setStartTime(date);
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endTime || new Date()}
              mode="datetime"
              onChange={(_, date) => {
                setShowEndPicker(false);
                if (date) setEndTime(date);
              }}
            />
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={{ color: "#374151" }}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleConfirm}>
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
    borderRadius: 10,
    padding: 16,
    width: "90%",
  },
  header: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    padding: 10,
    marginVertical: 5,
  },
  timePicker: {
    fontSize: 15,
    color: "#007AFF",
    marginVertical: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
  },
  submitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#007AFF",
    borderRadius: 6,
  },
});
