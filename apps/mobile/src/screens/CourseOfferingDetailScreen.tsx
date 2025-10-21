import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { fetchOfferingDetail } from "../services/offeringService";

export default function CourseOfferingDetailScreen() {
    const route = useRoute();
    const { id } = route.params as { id: number };
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const detail = await fetchOfferingDetail(id);
                setData(detail);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading)
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
            </SafeAreaView>
        );

    if (!data)
        return (
            <SafeAreaView style={styles.center}>
                <Text>Không tìm thấy thông tin lớp học phần.</Text>
            </SafeAreaView>
        );

    const dayNames = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

    const now = new Date();
    const isOutOfSemester = new Date(data.semester.end_date) < now;

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* Header */}
                <View style={styles.headerBox}>
                    <Text style={styles.header}>{data.name}</Text>
                    <Text style={styles.sub}>
                        {data.class_code} - {data.semester.name} ({data.semester.academic_year})
                    </Text>
                    <Text style={styles.status}>
                        Trạng thái:{" "}
                        <Text style={[styles.statusValue, data.status === "locked" && styles.locked]}>
                            {data.status === "locked" ? "Đã khóa" : data.status}
                        </Text>
                    </Text>
                </View>

                {isOutOfSemester && (
                    <View style={styles.warningBox}>
                        <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
                        <Text style={styles.warningText}>
                            Lớp học phần này không còn trong học kỳ hiện tại.
                        </Text>
                    </View>
                )}

                {/* Thông tin chung */}
                <View style={styles.infoBox}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
                        <Text style={styles.sectionTitle}>
                            Thông tin lớp học phần
                        </Text>
                    </View>
                    <Text style={styles.infoItem}>Số tín chỉ: {data.course.credit}</Text>
                    <Text style={styles.infoItem}>
                        Học phí:{" "}
                        {data.course.tuition_fee
                            ? `${data.course.tuition_fee.toLocaleString("vi-VN")}₫`
                            : "Chưa cập nhật"}
                    </Text>
                    <Text style={styles.infoItem}>Sĩ số: {data.capacity}</Text>
                    <Text style={styles.infoItem}>Đã đăng ký: {data.registered}</Text>
                    {data.description && (
                        <Text style={styles.infoItem}>Mô tả: {data.description}</Text>
                    )}
                    <Text style={styles.infoItem}>
                        Thời gian học:{" "}
                        {new Date(data.semester.start_date).toLocaleDateString("vi-VN")} →{" "}
                        {new Date(data.semester.end_date).toLocaleDateString("vi-VN")}
                    </Text>
                </View>

                {/* Giảng viên lý thuyết */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="school-outline" size={22} color="#007AFF" />
                        <Text style={styles.sectionTitle}>Giảng viên lý thuyết</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.infoName} numberOfLines={2} ellipsizeMode="tail">
                            {data.lecturer.full_name}
                        </Text>
                        <Text style={styles.email} numberOfLines={2} ellipsizeMode="tail">
                            {data.lecturer.email}
                        </Text>

                        {!isOutOfSemester && (
                            <TouchableOpacity style={styles.button}>
                                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
                                <Text style={styles.buttonText}> Nhắn tin</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={styles.sectionSubtitle}>Lịch học lý thuyết</Text>
                        {data.schedule.length > 0 ? (
                            data.schedule.map((s: any) => (
                                <Text key={s.id} style={styles.schedule}>
                                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />{" "}
                                    {dayNames[s.day_of_week]} - {s.building}
                                    {s.classroom ? `.${s.classroom}` : ""} - Tiết {s.start_period} →{" "}
                                    {s.start_period + s.period_count - 1}
                                </Text>
                            ))
                        ) : (
                            <Text style={styles.noSchedule}>Không có lịch học.</Text>
                        )}
                    </View>
                </View>

                {/* Giảng viên thực hành */}
                {data.practice_group && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="flask-outline" size={22} color="#10B981" />
                            <Text style={[styles.sectionTitle, { color: "#065F46" }]}>
                                Giảng viên thực hành
                            </Text>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.infoName} numberOfLines={2} ellipsizeMode="tail">
                                {data.practice_group.lecturer.full_name}
                            </Text>
                            <Text style={styles.email} numberOfLines={2} ellipsizeMode="tail">
                                {data.practice_group.lecturer.email}
                            </Text>

                            <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
                                <Ionicons name="people-outline" size={16} color="#4B5563" />
                                <Text style={styles.infoItem}>
                                    Nhóm: {data.practice_group.group_number} | Sĩ số:{" "}
                                    {data.practice_group.capacity} (ĐK: {data.practice_group.registered})
                                </Text>
                            </View>

                            {!isOutOfSemester && (
                                <TouchableOpacity style={[styles.button, { backgroundColor: "#10B981" }]}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#fff" />
                                    <Text style={styles.buttonText}> Nhắn tin</Text>
                                </TouchableOpacity>
                            )}

                            <Text style={styles.sectionSubtitle}>Lịch học thực hành</Text>
                            {data.practice_group.schedule.length > 0 ? (
                                data.practice_group.schedule.map((s: any) => (
                                    <Text key={s.id} style={styles.schedule}>
                                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />{" "}
                                        {dayNames[s.day_of_week]} - {s.building}
                                        {s.classroom ? `.${s.classroom}` : ""} - Tiết {s.start_period} →{" "}
                                        {s.start_period + s.period_count - 1}
                                    </Text>
                                ))
                            ) : (
                                <Text style={styles.noSchedule}>Không có lịch học.</Text>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        padding: 16,
        paddingBottom: 40,
    },
    headerBox: {
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        paddingBottom: 8,
    },
    header: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
    },
    sub: {
        fontSize: 15,
        color: "#6B7280",
        marginTop: 4,
    },
    status: {
        fontSize: 15,
        color: "#444",
        marginTop: 6,
    },
    statusValue: {
        fontWeight: "600",
        textTransform: "capitalize",
    },
    locked: {
        color: "#DC2626",
    },
    infoBox: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 14,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1F2937",
    },
    sectionSubtitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#374151",
        marginTop: 8,
        marginBottom: 4,
    },
    infoItem: {
        fontSize: 15,
        color: "#374151",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 14,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    infoName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    email: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 6,
        maxWidth: "95%",
        lineHeight: 18,
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#007AFF",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 6,
        alignSelf: "flex-start",
        marginBottom: 8,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "500",
    },
    schedule: {
        fontSize: 14,
        color: "#374151",
        marginTop: 2,
    },
    noSchedule: {
        fontSize: 14,
        color: "#9CA3AF",
    },
    warningBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FCA5A5",
        padding: 10,
        borderRadius: 8,
        marginBottom: 14,
    },
    warningText: {
        color: "#B91C1C",
        fontSize: 14,
        marginLeft: 6,
        flex: 1,
        flexWrap: "wrap",
    },
});
