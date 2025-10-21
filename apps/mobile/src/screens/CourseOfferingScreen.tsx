import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Modal,
    FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCourseOfferings } from "../hooks/useCourseOfferings";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import LoadingScreen from "../components/LoadingScreen";
import HeaderBar from "../components/HeaderBar";

const DAY_NAMES = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
];

type CourseOfferingNav = NativeStackNavigationProp<
  RootStackParamList,
  "CourseOffering"
>;

export default function CourseOfferingScreen() {
    const navigation = useNavigation<CourseOfferingNav>();
    const {
        semesters,
        semester,
        setSemester,
        offerings,
        loading,
        error,
        loadOfferingsBySemester,
    } = useCourseOfferings();

    const [modalVisible, setModalVisible] = useState(false);

    const handleSelectSemester = async (item: any) => {
        setSemester(item);
        setModalVisible(false);
        await loadOfferingsBySemester(item.id);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <HeaderBar title="Danh sách lớp học phần" />

            {/* Nội dung */}
            <View style={styles.container}>
                <Text style={styles.label}>Chọn học kỳ:</Text>

                {/* Ô chọn học kỳ */}
                <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
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

                {/* Nội dung lớp học phần */}
                {loading ? (
                    <LoadingScreen text="Đang tải chi tiết lớp học phần..." />
                ) : error ? (
                    <Text style={styles.error}>{error}</Text>
                ) : offerings.length === 0 ? (
                    <Text style={styles.noOffering}>Không có lớp học phần trong học kỳ này.</Text>
                ) : (
                    <ScrollView contentContainerStyle={styles.scroll}>
                        {offerings.map((item) => {
                            const theory = item.detail?.schedule?.[0];
                            const practice = item.detail?.practice_group?.schedule?.[0];

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.card}
                                    activeOpacity={0.8}
                                    onPress={() => navigation.navigate("CourseOfferingDetail", { id: item.id })}
                                >
                                    <Text style={styles.courseName}>{item.name}</Text>
                                    <Text style={styles.subText}>Mã lớp: {item.class_code}</Text>

                                    {/* Lý thuyết */}
                                    <Text style={styles.sectionTitle}>Lý thuyết:</Text>
                                    <Text style={styles.subText}>
                                        Giảng viên: {item.detail?.lecturer?.full_name ?? "—"}
                                    </Text>
                                    {theory && (
                                        <Text style={styles.subText}>
                                            {DAY_NAMES[theory.day_of_week]} — Tiết {theory.start_period} →{" "}
                                            {theory.start_period + theory.period_count - 1} | Phòng{" "}
                                            {theory.building}-{theory.classroom}
                                        </Text>
                                    )}

                                    {/* Thực hành */}
                                    {item.detail?.practice_group && (
                                        <>
                                            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Thực hành:</Text>
                                            <Text style={styles.subText}>
                                                Giảng viên: {item.detail.practice_group.lecturer.full_name ?? "—"}
                                            </Text>
                                            {practice && (
                                                <Text style={styles.subText}>
                                                    {DAY_NAMES[practice.day_of_week]} — Tiết {practice.start_period} →{" "}
                                                    {practice.start_period + practice.period_count - 1} | Phòng{" "}
                                                    {practice.building}-{practice.classroom}
                                                </Text>
                                            )}
                                        </>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#fff" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        backgroundColor: "#1E3A8A"
    },
    backButton: { padding: 4 },
    title: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
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

    scroll: { paddingBottom: 40 },
    card: {
        backgroundColor: "#F3F4F6",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    courseName: { fontSize: 16, fontWeight: "700", color: "#111827" },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1E3A8A",
        marginTop: 4,
    },
    subText: { fontSize: 14, color: "#374151", marginTop: 2 },
    error: { color: "red", textAlign: "center", marginTop: 20 },
    noOffering: { textAlign: "center", fontSize: 15, marginTop: 40, color: "#6B7280" },
});
