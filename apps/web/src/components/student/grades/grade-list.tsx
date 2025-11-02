"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useUser } from "@/context/user-context";
import { useGrades } from "@/hooks/useGrades";
import { useSemesterSummaries } from "@/hooks/useSemesterSummary";
import { fetchSemestersByStudentYear } from "@/services/semesterService";
import { getClassificationLabel } from "@/utils/get-classification-label";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";

import type { Semester } from "@/services/semesterService";

export default function GradesList() {
    const { userData } = useUser();
    const isParent = userData?.role === "parent";
    const children = userData?.children || [];
    // const initialStudentId = userData?.student?.id ?? null;

    // const isParent = userData?.role === "parent";
    // const children = userData?.children || [];
    const [selectedChildIndex, setSelectedChildIndex] = useState(0);
    const activeChild = isParent ? children[selectedChildIndex] : null;

    console.log("userData:", userData);

    const initialStudentId: number | null = isParent
        ? (activeChild?.id ?? null)
        : (userData?.student?.id ?? null);
    const studentYear = isParent
        ? parseInt(activeChild?.academic_year?.split(" - ")[0] || "")
        : parseInt(userData?.student?.academic_year?.split(" - ")[0] || "");

    console.log("studentYear:", studentYear);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(
        initialStudentId
    );
    console.log("initialStudentId:", initialStudentId);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [loadingSemesters, setLoadingSemesters] = useState(true);

    useEffect(() => {
        if (userData?.student?.id) {
            setSelectedStudentId(userData.student.id);
        } else if (isParent && children.length > 0) {
            setSelectedStudentId(children[0].id);
        }
    }, [userData, isParent, children]);

    useEffect(() => {
        const load = async () => {
            const data = await fetchSemestersByStudentYear(studentYear);
            setSemesters(data);
            setLoadingSemesters(false);
        };
        load();
    }, []);

    useEffect(() => {
        if (isParent && children.length > 0 && !selectedStudentId) {
            setSelectedStudentId(children[0].id);
        }
    }, [isParent, children, selectedStudentId]);

    const { gradesBySemester, loading: loadingGrades } = useGrades(
        selectedStudentId || 0,
        semesters
    );

    const readyForSummary =
        selectedStudentId &&
        semesters.length > 0 &&
        Object.keys(gradesBySemester).length > 0;

    const semesterIdsWithGrades = useMemo(() => {
        return semesters
            .filter((s) => (gradesBySemester[s.id] || []).length > 0)
            .map((s) => s.id);
    }, [semesters, gradesBySemester]);

    const { summaries } = useSemesterSummaries(
        readyForSummary && semesterIdsWithGrades.length > 0
            ? selectedStudentId
            : null,
        readyForSummary ? semesterIdsWithGrades : []
    );

    console.log("selectedStudentId`:", selectedStudentId);
    console.log("Semesters:", semesters);
    console.log("Semester summaries:", summaries);

    //   const { getLatestWarningForSemester } = useAcademicWarnings();

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    };

    const formatScore = (v?: number | null) => (v != null ? v.toFixed(2) : "-");
    const formatList = (arr: number[]) =>
        arr.length ? arr.map((x) => x.toFixed(2)).join(", ") : "-";

    if (loadingSemesters || loadingGrades)
        return (
            <Loading text="Đang tải lớp học phần..." />
        );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-indigo-800 mb-2">
                Kết quả học tập
            </h1>

            {/* Tabs chọn con nếu là phụ huynh */}
            {isParent && children.length > 0 && (
                <div className="flex flex-wrap gap-2 bg-indigo-50 p-2 rounded-lg">
                    {children.map((child: any) => (
                        <Button
                            key={child.id}
                            size="sm"
                            variant={
                                selectedStudentId === child.id ? "default" : "outline"
                            }
                            onClick={() => setSelectedStudentId(child.id)}
                        >
                            {child.users?.full_name}
                        </Button>
                    ))}
                </div>
            )}

            {/* Danh sách học kỳ */}
            <div className="space-y-4">
                {semesters.map((semester) => {
                    const grades = gradesBySemester[semester.id] || [];
                    if (grades.length === 0) return null;

                    const expanded = expandedIds.includes(semester.id);
                    const summary = summaries[semester.id];

                    return (
                        <Card
                            key={semester.id}
                            className="border border-indigo-100 rounded-xl overflow-hidden"
                        >
                            <button
                                onClick={() => toggleExpand(semester.id)}
                                className="w-full flex justify-between items-center bg-blue-50 px-4 py-2 text-blue-800 font-medium"
                            >
                                <span>
                                    {semester.name} ({semester.academic_year})
                                </span>
                                {expanded ? (
                                    <ChevronUp size={18} />
                                ) : (
                                    <ChevronDown size={18} />
                                )}
                            </button>

                            {expanded && (
                                <div className="p-4 space-y-6">
                                    {grades.map((course) => {
                                        const regular = course.theoryScores
                                            .filter((s) => s.score_type === "regular")
                                            .map((s) => s.score);
                                        const midterm = course.theoryScores
                                            .filter((s) => s.score_type === "midterm")
                                            .map((s) => s.score);
                                        const final = course.theoryScores
                                            .filter((s) => s.score_type === "final")
                                            .map((s) => s.score);
                                        const practice = course.practiceScores.map((s) => s.score);

                                        return (
                                            <div
                                                key={course.offering_id}
                                                className="border-t border-gray-200 pt-3"
                                            >
                                                <h3 className="font-semibold text-gray-800 text-lg mb-1">
                                                    {course.offering_name}
                                                </h3>
                                                <div className="space-y-1 text-sm">
                                                    {regular.length > 0 && (
                                                        <ScoreRow
                                                            label="Điểm thường kỳ"
                                                            value={formatList(regular)}
                                                        />
                                                    )}
                                                    {practice.length > 0 && (
                                                        <ScoreRow
                                                            label="Điểm thực hành"
                                                            value={formatList(practice)}
                                                        />
                                                    )}
                                                    {midterm.length > 0 && (
                                                        <ScoreRow
                                                            label="Điểm giữa kỳ"
                                                            value={formatList(midterm)}
                                                        />
                                                    )}
                                                    {final.length > 0 && (
                                                        <ScoreRow
                                                            label="Điểm cuối kỳ"
                                                            value={formatList(final)}
                                                        />
                                                    )}
                                                </div>

                                                {course.summary ? (
                                                    <div className="border-t border-gray-200 mt-2 pt-2 space-y-1 text-sm">
                                                        <ScoreRow
                                                            label="Thang điểm 4"
                                                            value={formatScore(course.summary.gpa4)}
                                                        />
                                                        <ScoreRow
                                                            label="Điểm chữ"
                                                            value={course.summary.letter_grade}
                                                        />
                                                        <ScoreRow
                                                            label="Xếp loại"
                                                            value={getClassificationLabel(
                                                                course.summary.classification
                                                            )}
                                                        />

                                                        <div className="flex items-center mt-3">
                                                            <span className="text-gray-600 text-sm mr-2">Kết quả:</span>
                                                            {course.summary.passed ? (
                                                                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                                                                    <CheckCircle size={18} />
                                                                    <span className="font-semibold">Đạt</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-200">
                                                                    <XCircle size={18} />
                                                                    <span className="font-semibold">Không đạt</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="italic text-gray-500 text-sm mt-2">
                                                        Chưa có tổng kết
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Tổng kết học kỳ */}
                                    {summary && Object.keys(summary).length > 0 && (
                                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <h4 className="font-semibold text-blue-800 mb-2">
                                                Tổng kết học kỳ
                                            </h4>
                                            <div className="space-y-1 text-sm">
                                                <ScoreRow
                                                    label="Điểm TB tích lũy hệ 10"
                                                    value={formatScore(summary.cum_avg_score_10)}
                                                />
                                                <ScoreRow
                                                    label="Điểm TB tích lũy hệ 4"
                                                    value={formatScore(summary.cum_avg_score_4)}
                                                />
                                                <ScoreRow
                                                    label="Xếp loại tích lũy"
                                                    value={getClassificationLabel(
                                                        summary.cumulative_classification
                                                    )}
                                                />
                                                <ScoreRow
                                                    label="Điểm TB hệ 10"
                                                    value={formatScore(summary.avg_score_10)}
                                                />
                                                <ScoreRow
                                                    label="Điểm TB hệ 4"
                                                    value={formatScore(summary.avg_score_4)}
                                                />
                                                <ScoreRow
                                                    label="Xếp loại học kỳ"
                                                    value={getClassificationLabel(
                                                        summary.semester_classification
                                                    )}
                                                />
                                                <ScoreRow
                                                    label="Tổng tín chỉ đạt"
                                                    value={summary.total_credit_passed ?? 0}
                                                />
                                                <ScoreRow
                                                    label="Tổng tín chỉ rớt"
                                                    value={summary.total_credit_failed ?? 0}
                                                />
                                            </div>

                                            {/* {selectedStudentId && (
                        <div className="mt-2">
                          <WarningDisplay
                            studentId={selectedStudentId}
                            semesterId={semester.id}
                          />
                        </div>
                      )} */}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

const ScoreRow = ({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) => (
    <div className="flex justify-between text-gray-700">
        <span>{label}</span>
        <span className="font-medium">{value}</span>
    </div>
);
