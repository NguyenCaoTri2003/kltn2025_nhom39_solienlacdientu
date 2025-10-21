import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useGrades } from "../hooks/useGrades";
import { fetchSemesters, Semester } from "../services/semesterService";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { CheckCircle, XCircle } from "lucide-react-native";

type Props = {
    studentId: number;
    semesters: Semester[];
};

type GradesRouteProp = RouteProp<RootStackParamList, "Grades">;

export default function GradesScreen() {
    const route = useRoute<GradesRouteProp>();
    const { studentId } = route.params;

    const [semesters, setSemesters] = useState<Semester[]>([]);

    useEffect(() => {
        async function loadSemesters() {
            const data = await fetchSemesters();
            setSemesters(data);
        }
        loadSemesters();
    }, []);

    const { gradesBySemester, loading } = useGrades(studentId, semesters);
    const [expandedSemesterIds, setExpandedSemesterIds] = useState<number[]>([]);

    const toggleSemester = (id: number) => {
        setExpandedSemesterIds((prev) =>
            prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, padding: 16 }}>
            <FlatList
                data={semesters}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item: semester }) => {
                    const grades = gradesBySemester[semester.id] || [];
                    if (grades.length === 0) return null; // không hiển thị kì không có điểm

                    const isExpanded = expandedSemesterIds.includes(semester.id);

                    return (
                        <View style={styles.semesterContainer}>
                            <TouchableOpacity onPress={() => toggleSemester(semester.id)}>
                                <Text style={styles.semesterTitle}>{semester.name}</Text>
                            </TouchableOpacity>

                            {isExpanded &&
                                grades.map((course) => {
                                    const regularScores = course.theoryScores
                                        .filter((s) => s.score_type === "regular")
                                        .map((s) => s.score);

                                    const midtermScores = course.theoryScores
                                        .filter((s) => s.score_type === "midterm")
                                        .map((s) => s.score);

                                    const finalScores = course.theoryScores
                                        .filter((s) => s.score_type === "final")
                                        .map((s) => s.score);

                                    const practiceScores = course.practiceScores.map((s) => s.score);

                                    return (
                                        <View key={course.offering_id} style={styles.courseCard}>
                                            <Text style={styles.courseName}>{course.offering_name}</Text>

                                            {regularScores.length > 0 && (
                                                <Text style={styles.scoreText}>Điểm thường kỳ: {regularScores.join(", ")}</Text>
                                            )}

                                            {practiceScores.length > 0 && (
                                                <Text style={styles.scoreText}>Điểm thực hành: {practiceScores.join(", ")}</Text>
                                            )}

                                            {midtermScores.length > 0 && (
                                                <Text style={styles.scoreText}>Điểm giữa kỳ: {midtermScores.join(", ")}</Text>
                                            )}

                                            {finalScores.length > 0 && (
                                                <Text style={styles.scoreText}>Điểm cuối kỳ: {finalScores.join(", ")}</Text>
                                            )}

                                            {course.summary ? (
                                                <>
                                                    <Text style={styles.scoreText}>Thang điểm 4: {course.summary.gpa4}</Text>
                                                    <Text style={styles.scoreText}>Điểm chữ: {course.summary.letter_grade}</Text>
                                                    <Text style={styles.scoreText}>Xếp loại: {course.summary.classification}</Text>
                                                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                                                        <Text style={styles.scoreText}>Đạt: </Text>
                                                        {course.summary.passed ? (
                                                            <CheckCircle color="green" size={20} />
                                                        ) : (
                                                            <XCircle color="red" size={20} />
                                                        )}
                                                    </View>
                                                </>
                                            ) : (
                                                <Text style={styles.summaryText}>Chưa có tổng kết</Text>
                                            )}
                                        </View>
                                    );
                                })}
                        </View>
                    );
                }}
            />
            {loading && <Text>Đang tải...</Text>}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    semesterContainer: { marginBottom: 16 },
    semesterTitle: { fontSize: 18, fontWeight: "700", color: "#0284C7", marginBottom: 6 },
    courseCard: {
        padding: 12,
        backgroundColor: "#F3F4F6",
        borderRadius: 8,
        marginBottom: 8,
    },
    courseName: { fontWeight: "600", fontSize: 16, marginBottom: 4 },
    scoreText: { fontSize: 14, marginVertical: 1, color: "#374151" },
    summaryText: { marginTop: 4, fontStyle: "italic", color: "#111827" },
});
