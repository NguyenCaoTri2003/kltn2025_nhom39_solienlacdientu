import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStudentSchedule } from "../hooks/useStudentSchedule";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";
import HeaderBar from "../components/HeaderBar";
import dayjs from "dayjs";

export default function ScheduleScreen() {
  const { user } = useAuth();
  const studentId = user?.role === "student" ? user.id : 0;
  const {
    schedules,
    loading,
    error,
    weekLabel,
    nextWeek,
    prevWeek,
    weekDays,
  } = useStudentSchedule(studentId);

  // lưu ngày đang chọn
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

  // lọc lịch theo ngày đang chọn
  const filteredSchedules = schedules.filter(
    (s) => dayjs(s.schedule_date).format("YYYY-MM-DD") === selectedDate
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title="Lịch học / Lịch thi" />

      <View style={styles.container}>
        {/* Thanh chọn tuần */}
        <View style={styles.weekHeader}>
          <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.weekText}>{weekLabel}</Text>
          <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={24} color="#1E3A8A" />
          </TouchableOpacity>
        </View>

        {/* 7 ô ngày trong tuần */}
        <View style={styles.daySelector}>
          {weekDays.map((day) => {
            const dateStr = day.format("YYYY-MM-DD");
            const isSelected = selectedDate === dateStr;
            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayBox,
                  isSelected && styles.dayBoxSelected,
                ]}
                onPress={() => setSelectedDate(dateStr)}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    isSelected && styles.dayLabelSelected,
                  ]}
                >
                  {day.format("dd").toUpperCase()} {/* Thứ (Mo, Tu...) */}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                  ]}
                >
                  {day.format("D")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Nội dung */}
        {loading ? (
          <LoadingScreen text="Đang tải lịch học..." />
        ) : error ? (
          <View style={styles.center}>
            <Text style={{ color: "red" }}>Lỗi: {error}</Text>
          </View>
        ) : filteredSchedules.length === 0 ? (
          <View style={styles.center}>
            <Text>Không có lịch học trong ngày này</Text>
          </View>
        ) : (
          <FlatList
            data={filteredSchedules}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => {
              const isPractice = item.type === "practice";

              return (
                <View
                  style={[
                    styles.card,
                    isPractice ? styles.practiceCard : styles.theoryCard,
                  ]}
                >
                  <Text style={styles.title}>{item.course_offering.name}</Text>

                  <View style={styles.row}>
                    <Text style={styles.label}>Tiết:</Text>
                    <Text style={styles.value}>
                      {item.start_period} - {item.start_period + item.period_count - 1}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.label}>Phòng:</Text>
                    <Text style={styles.value}>
                      {item.classroom}
                    </Text>
                  </View>

                  {item.lecturer && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Giảng viên:</Text>
                      <Text style={styles.value}>{item.lecturer.full_name}</Text>
                    </View>
                  )}

                  {isPractice && item.practice_group && (
                    <View style={styles.row}>
                      <Text style={styles.label}>Nhóm thực hành:</Text>
                      <Text style={styles.value}>{item.practice_group.group_number}</Text>
                    </View>
                  )}

                  {item.note && <Text style={styles.note}>Ghi chú: {item.note}</Text>}
                </View>
              );
            }}
          />

        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1, padding: 16, backgroundColor: "#F9FAFB" },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  navBtn: { padding: 6 },
  weekText: { fontSize: 16, fontWeight: "600", color: "#1E3A8A", marginHorizontal: 12 },

  daySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  dayBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 3,
  },
  dayBoxSelected: {
    backgroundColor: "#1E3A8A",
  },
  dayLabel: { fontSize: 12, color: "#374151" },
  dayLabelSelected: { color: "white" },
  dayNumber: { fontSize: 16, fontWeight: "600", color: "#111827" },
  dayNumberSelected: { color: "white" },

  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  theoryCard: {
    backgroundColor: "#E0F2FE",
    borderLeftWidth: 4,
    borderLeftColor: "#0284C7",
  },
  practiceCard: {
    backgroundColor: "#F3E8FF",
    borderLeftWidth: 4,
    borderLeftColor: "#9333EA",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  subText: {
    color: "#374151",
    fontSize: 14,
    marginTop: 2,
  },
  note: {
    color: "#6B7280",
    fontStyle: "italic",
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  label: {
    color: "#111827",
    width: 120, 
  },

  value: {
    color: "#374151",
    fontSize: 14,
    flexShrink: 1,
    fontWeight: "600"
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
