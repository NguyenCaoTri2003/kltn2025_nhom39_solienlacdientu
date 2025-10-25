import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useUser } from "../context/UserContext";
import { fetchOfferingsBySemester } from "../services/offeringService";
import { fetchAttendanceByOffering } from "../services/attendanceService";
import { fetchSemesters } from "../services/semesterService";
import HeaderBar from "../components/HeaderBar";
import LoadingScreen from "../components/LoadingScreen";
import { formatDateTime, statusMap, typeMap } from "../utils/attendanceHelpers";

export default function AttendanceScreen() {
  const { userData } = useUser();
  const isParent = userData?.role === "parent";
  const children = userData?.children || [];
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const activeChild = isParent ? children[selectedChildIndex] : null;

  const [semesters, setSemesters] = useState<any[]>([]);
  const [semester, setSemester] = useState<any>(null);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const studentId = isParent ? activeChild?.id : userData?.student?.id;
  const studentYear = isParent
    ? activeChild?.academic_year
    : userData?.student?.academic_year;

  const match = studentYear?.match(/(\d{4})/) || null;

  console.log(">>>>> studentYear:", studentYear);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    fetchSemesters(match ? Number(match[1]) : undefined)
      .then((data) => {
        setSemesters(data);
        if (data.length > 0) {
          const now = new Date();
          const currentSemester = data.find((s: any) => {
            const [year, term] = s.academic_year.split("-").map(Number);
            return year === now.getFullYear();
          });
          setSemester(currentSemester || data[data.length - 1]);
        }
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    if (!semester || !studentId) return;
    setLoading(true);
    fetchOfferingsBySemester(semester.id, studentId)
      .then((data) => {
        setOfferings(data);
        setSelectedOffering(null);
        setAttendance([]);
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [semester, studentId]);

  const loadAttendance = async (offeringId: number) => {
    setSelectedOffering(offeringId);
    setLoadingAttendance(true);
    try {
      const data = await fetchAttendanceByOffering(studentId!, offeringId);
      setAttendance(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleSelectSemester = (item: any) => {
    setSemester(item);
    setModalVisible(false);
  };

  // ===== Khi thay đổi con =====
  const handleSelectChild = (index: number) => {
    setSelectedChildIndex(index);
    // reset dữ liệu con trước
    setSemester(null);
    setOfferings([]);
    setSelectedOffering(null);
    setAttendance([]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title="Điểm danh học phần" />

      {/* Chọn con (nếu phụ huynh nhiều con) */}
      {isParent && children.length > 1 && (
        <View style={styles.childTabs}>
          {children.map((child, index) => (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childTab,
                selectedChildIndex === index && styles.childTabActive,
              ]}
              onPress={() => handleSelectChild(index)}
            >
              <Text
                style={[
                  styles.childTabText,
                  selectedChildIndex === index && styles.childTabTextActive,
                ]}
              >
                {child.users?.full_name || `Con ${index + 1}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Chọn học kỳ */}
      <View style={styles.container}>
        <Text style={styles.label}>Chọn học kỳ:</Text>
        <TouchableOpacity
          style={styles.selectBox}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.selectText}>
            {semester
              ? `${semester.name} - ${semester.academic_year}`
              : "Chọn học kỳ..."}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#374151" />
        </TouchableOpacity>

        {/* Modal chọn học kỳ */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn học kỳ</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={22} color="#1E3A8A" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={semesters}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.semesterItem}
                    onPress={() => handleSelectSemester(item)}
                  >
                    <Text
                      style={[
                        styles.semesterText,
                        semester?.id === item.id && styles.selectedText,
                      ]}
                    >
                      {item.name} - {item.academic_year}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        <View style={{ flex: 1 }}>
          {loading ? (
            <LoadingScreen text="Đang tải lớp học phần..." />
          ) : offerings.length === 0 ? (
            <Text style={styles.noOffering}>Không có lớp học phần.</Text>
          ) : (
            <ScrollView
              horizontal
              style={{ marginVertical: 10, maxHeight: 50 }}
              contentContainerStyle={{ alignItems: "center" }}
            >
              {offerings.map((off) => (
                <TouchableOpacity
                  key={off.id}
                  style={[
                    styles.offeringBtn,
                    selectedOffering === off.id && styles.offeringBtnActive,
                  ]}
                  onPress={() => loadAttendance(off.id)}
                >
                  <Text
                    style={[
                      styles.offeringText,
                      selectedOffering === off.id && styles.offeringTextActive,
                    ]}
                  >
                    {off.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Danh sách điểm danh dọc */}
          <ScrollView style={{ flex: 1 }}>
            {loadingAttendance ? (
              <ActivityIndicator size="small" color="#1E3A8A" />
            ) : attendance.length === 0 ? (
              selectedOffering && <Text style={styles.noOffering}>Chưa có dữ liệu điểm danh.</Text>
            ) : (
              [...attendance]
                .sort(
                  (a, b) =>
                    new Date(b.attendance_date).getTime() -
                    new Date(a.attendance_date).getTime()
                )
                .map((att) => (
                  <View key={att.id} style={styles.card}>
                    <Text style={styles.date}>{formatDateTime(att.attendance_date)}</Text>
                    <Text>
                      <Text style={styles.bold}>{typeMap[att.type]}: </Text>
                      <Text style={{ color: statusMap[att.status].color }}>
                        {statusMap[att.status].label}
                      </Text>
                    </Text>
                    {att.note && <Text style={styles.note}>Ghi chú: {att.note}</Text>}
                  </View>
                ))
            )}
          </ScrollView>
        </View>


      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 16 },
  label: { fontSize: 15, fontWeight: "600", color: "#1E3A8A", marginBottom: 6 },
  selectBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  selectText: { fontSize: 16, color: "#111827" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    maxHeight: "70%",
    paddingBottom: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: { fontSize: 16, fontWeight: "600", color: "#1E3A8A" },
  semesterItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  semesterText: { fontSize: 15, color: "#111827" },
  selectedText: { color: "#1E3A8A", fontWeight: "600" },
  offeringBtn: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  offeringBtnActive: {
    backgroundColor: "#1E3A8A",
  },
  offeringText: { color: "#111827", fontSize: 14 },
  offeringTextActive: { color: "#fff" },
  card: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  date: { fontWeight: "bold", color: "#111827", marginBottom: 4 },
  bold: { fontWeight: "600" },
  note: { color: "#6B7280", marginTop: 4 },
  noOffering: {
    textAlign: "center",
    fontSize: 15,
    marginTop: 30,
    color: "#6B7280",
  },
  error: { color: "red", textAlign: "center", marginTop: 20 },
  childTabs: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    paddingVertical: 8,
    justifyContent: "center",
    gap: 8,
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
  childTabText: { color: "#374151", fontSize: 14, fontWeight: "500" },
  childTabTextActive: { color: "#fff" },
});
