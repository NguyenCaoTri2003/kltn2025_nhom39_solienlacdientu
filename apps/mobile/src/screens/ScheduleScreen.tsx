import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStudentSchedule } from "../hooks/useStudentSchedule";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";
import HeaderBar from "../components/HeaderBar";
import dayjs from "dayjs";
import { useUser } from "../context/UserContext";

export default function ScheduleScreen() {
  const { userData } = useUser();
  const children = userData?.children || [];
  const isParent = userData?.role === "parent";

  const initialStudentId: number | null | undefined =
    userData?.role === "student"
      ? userData?.student?.id
      : children.length > 0
        ? children[0].id
        : null;

  const [selectedStudentId, setSelectedStudentId] = useState<number | null | undefined>(initialStudentId);

  const {
    schedules,
    loading,
    error,
    weekLabel,
    nextWeek,
    prevWeek,
    weekDays,
  } = useStudentSchedule(selectedStudentId);

  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

  const filteredSchedules = schedules.filter(
    (s) => dayjs(s.schedule_date).format("YYYY-MM-DD") === selectedDate
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title="Lịch học / Lịch thi" />

      <View style={styles.container}>

        <View>
          {isParent && children.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.childTabs}
              contentContainerStyle={{ paddingHorizontal: 10, height: 30, alignItems: "center", flex: 1, justifyContent: "center", gap: 8 }}
            >
              {children.map((child: any) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childTab,
                    selectedStudentId === child.id && styles.childTabActive,
                  ]}
                  onPress={() => setSelectedStudentId(child.id)}
                >
                  <Text
                    style={[
                      styles.childTabText,
                      selectedStudentId === child.id && styles.childTabTextActive,
                    ]}
                  >
                    {child?.users?.full_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.weekHeader}>
          <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <Text style={styles.weekText}>{weekLabel}</Text>
          <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={24} color="#1E3A8A" />
          </TouchableOpacity>
        </View>

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
                  {day.format("dd").toUpperCase()}
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
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 10 }}
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
                    <Text style={styles.value}>{item.classroom}</Text>
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

// --- Styles tab con ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1, backgroundColor: "#F9FAFB" },

  childTabs: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    marginBottom: 8,
  },

  childTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },

  childTabActive: {
    backgroundColor: "#1E3A8A",
  },

  childTabText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },

  childTabTextActive: {
    color: "#fff",
  },

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
    paddingHorizontal: 3
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
  title: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 6 },
  note: { color: "#6B7280", fontStyle: "italic", marginTop: 6 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  label: { color: "#111827", width: 120 },
  value: { color: "#374151", fontSize: 14, flexShrink: 1, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});