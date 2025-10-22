import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useRoute } from "@react-navigation/native";
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react-native";

import HeaderBar from "../components/HeaderBar";
import LoadingScreen from "../components/LoadingScreen";
import { useGrades } from "../hooks/useGrades";
import { useSemesterSummaries } from "../hooks/useSemesterSummary";
import { fetchSemesters, Semester } from "../services/semesterService";
import { RootStackParamList } from "../types/navigation";
import { getClassificationLabel } from "../utils/getClassificationLabel";

type GradesRouteProp = RouteProp<RootStackParamList, "Grades">;

export default function GradesScreen() {
  const route = useRoute<GradesRouteProp>();
  const { studentId } = route.params;

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [expandedSemesterIds, setExpandedSemesterIds] = useState<number[]>([]);

  // Load danh sách học kỳ
  useEffect(() => {
    async function loadSemesters() {
      const data = await fetchSemesters();
      setSemesters(data);
    }
    loadSemesters();
  }, []);

  // Lấy điểm theo học kỳ
  const { gradesBySemester, loading } = useGrades(studentId, semesters);

  // Lấy tổng kết học kỳ
  const semesterIdsWithGrades = useMemo(() => {
    return semesters
      .filter((s) => (gradesBySemester[s.id] || []).length > 0)
      .map((s) => s.id);
  }, [semesters, gradesBySemester]);

  const { summaries } = useSemesterSummaries(studentId, semesterIdsWithGrades);

  const toggleSemester = (id: number) => {
    setExpandedSemesterIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  function formatScore(value?: number | null) {
    return value != null ? value.toFixed(2) : "-";
  }

  function formatScoresList(scores: number[]) {
    return scores.map((s) => s.toFixed(2)).join(", ");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <HeaderBar title="Kết quả học tập" />
      {loading && <LoadingScreen text="Đang tải kết quả học tập..." />}

      <FlatList
        data={semesters}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item: semester }) => {
          const grades = gradesBySemester[semester.id] || [];
          if (grades.length === 0) return null;

          const isExpanded = expandedSemesterIds.includes(semester.id);
          const summary = summaries[semester.id];

          return (
            <View style={styles.semesterContainer}>
              <TouchableOpacity
                onPress={() => toggleSemester(semester.id)}
                style={styles.semesterHeader}
              >
                <Text style={styles.semesterTitle}>
                  {semester.name} ({semester.academic_year})
                </Text>
                {isExpanded ? (
                  <ChevronUp size={20} color="#0284C7" />
                ) : (
                  <ChevronDown size={20} color="#0284C7" />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={{ paddingBottom: 10 }}>
                  {/* Danh sách môn */}
                  {grades.map((course) => {
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
                        <View style={styles.scoreRowGroup}>
                          {regularScores.length > 0 && (
                            <ScoreRow label="Điểm thường kỳ" value={formatScoresList(regularScores)} />
                          )}
                          {practiceScores.length > 0 && (
                            <ScoreRow label="Điểm thực hành" value={formatScoresList(practiceScores)} />
                          )}
                          {midtermScores.length > 0 && (
                            <ScoreRow label="Điểm giữa kỳ" value={formatScoresList(midtermScores)} />
                          )}
                          {finalScores.length > 0 && (
                            <ScoreRow label="Điểm cuối kỳ" value={formatScoresList(finalScores)} />
                          )}
                        </View>

                        {course.summary ? (
                          <View style={styles.summaryBox}>
                            <ScoreRow label="Thang điểm 4" value={formatScore(course.summary.gpa4 ?? "-")} />
                            <ScoreRow label="Điểm chữ" value={course.summary.letter_grade} />
                            <ScoreRow
                              label="Xếp loại"
                              value={getClassificationLabel(course.summary.classification)}
                            />

                            <View style={styles.passRow}>
                              <Text style={styles.scoreLabel}>Kết quả:</Text>
                              {course.summary.passed ? (
                                <View style={styles.passStatus}>
                                  <CheckCircle color="#22C55E" size={20} />
                                  <Text style={[styles.scoreValue, { color: "#22C55E" }]}>Đạt</Text>
                                </View>
                              ) : (
                                <View style={styles.passStatus}>
                                  <XCircle color="#EF4444" size={20} />
                                  <Text style={[styles.scoreValue, { color: "#EF4444" }]}>
                                    Không đạt
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        ) : (
                          <Text style={styles.noSummaryText}>Chưa có tổng kết</Text>
                        )}
                      </View>
                    );
                  })}

                  {/* --- Tổng kết học kỳ --- */}
                  {summary && (
                    <View style={styles.semesterSummary}>
                      <Text style={styles.semesterSummaryTitle}>Tổng kết học kỳ</Text>
                      <ScoreRow
                        label="Điểm trung bình tích lũy hệ 10"
                        value={formatScore(summary.cum_avg_score_10 ?? "-")}
                      />
                      <ScoreRow
                        label="Điểm trung bình tích lũy hệ 4"
                        value={formatScore(summary.cum_avg_score_4 ?? "-")}
                      />
                      <ScoreRow
                        label="Xếp loại tích lũy"
                        value={getClassificationLabel(summary.cumulative_classification)}
                      />
                      <ScoreRow label="Điểm trung bình hệ 10" value={formatScore(summary.avg_score_10 ?? "-")} />
                      <ScoreRow label="Điểm trung bình hệ 4" value={formatScore(summary.avg_score_4 ?? "-")} />
                      <ScoreRow
                        label="Xếp loại học kỳ"
                        value={getClassificationLabel(summary.semester_classification)}
                      /> 
                      <ScoreRow
                        label="Tổng tín chỉ đạt"
                        value={summary.total_credit_passed ?? 0}
                      />
                      <ScoreRow
                        label="Tổng tín chỉ rớt"
                        value={summary.total_credit_failed ?? 0}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const ScoreRow = ({ label, value }: { label: string; value: string | number }) => (
  <View style={styles.scoreRow}>
    <Text style={styles.scoreLabel}>{label}</Text>
    <Text style={styles.scoreValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  semesterContainer: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  semesterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E0F2FE",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  semesterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0284C7",
  },
  courseCard: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  courseName: {
    fontWeight: "600",
    fontSize: 15,
    color: "#111827",
    marginBottom: 8,
  },
  scoreRowGroup: { gap: 2, marginBottom: 8 },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  scoreLabel: {
    fontSize: 14,
    color: "#4B5563",
    flex: 1,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  summaryBox: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 6,
  },
  passRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  passStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  noSummaryText: {
    fontStyle: "italic",
    color: "#6B7280",
    marginTop: 8,
  },
  semesterSummary: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  semesterSummaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0369A1",
    marginBottom: 6,
  },
});
