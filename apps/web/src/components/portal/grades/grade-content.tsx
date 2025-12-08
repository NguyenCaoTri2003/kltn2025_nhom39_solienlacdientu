"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useGrades } from "@/hooks/useGrades";
import { useSemesterSummaries } from "@/hooks/useSemesterSummary";
import { fetchSemestersByStudentYear } from "@/services/semesterService";
import { getClassificationLabel } from "@/utils/get-classification-label";
import Loading from "@/components/ui/loading";
import type { Semester } from "@/services/semesterService";
import { Grade } from "@packages/core/entities/Grade";

export default function GradeContent({
  studentId,
  studentYear,
}: {
  studentId: number;
  studentYear: number | null;
}) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [loadingSemesters, setLoadingSemesters] = useState(true);

  useEffect(() => {
    if (!studentYear) return;
    const load = async () => {
      setLoadingSemesters(true);
      const data = await fetchSemestersByStudentYear(studentYear);

      const sorted = [...data].sort((a, b) => {
        const yearA = parseInt(a.academic_year.split("-")[0]);
        const yearB = parseInt(b.academic_year.split("-")[0]);
        if (yearA !== yearB) return yearB - yearA;

        const semA = parseInt(a.name.replace(/\D/g, ""));
        const semB = parseInt(b.name.replace(/\D/g, ""));
        return semB - semA;
      });

      setSemesters(sorted);
      setLoadingSemesters(false);
    };
    load();
  }, [studentYear]);

  const { gradesBySemester, loading: loadingGrades } = useGrades(
    studentId,
    semesters
  );

  console.log("gradesBySemester:", gradesBySemester);

  const semesterIdsWithGrades = useMemo(
    () =>
      semesters
        .filter((s) => (gradesBySemester[s.id] || []).length > 0)
        .map((s) => s.id),
    [semesters, gradesBySemester]
  );

  const readyForSummary =
    semesters.length > 0 && semesterIdsWithGrades.length > 0;

  const { summaries } = useSemesterSummaries(
    readyForSummary ? studentId : null,
    readyForSummary ? semesterIdsWithGrades : []
  );

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const formatScore = (v?: number | null) => (v != null ? v.toFixed(2) : "-");

  if (loadingSemesters || loadingGrades)
    return <Loading text="Đang tải kết quả học tập..." />;

  return (
    <div className="space-y-4">
      {semesters.map((semester) => {
        const grades = gradesBySemester[semester.id] || [];
        if (grades.length === 0) return null;

        const expanded = expandedIds.includes(semester.id);
        const summary = summaries[semester.id];

        return (
          <Card
            key={semester.id}
            className="border border-indigo-100 dark:border-indigo-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
          >
            <button
              onClick={() => toggleExpand(semester.id)}
              className="cursor-pointer w-full flex justify-between items-center bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-blue-800 dark:text-blue-200 font-medium"
            >
              <span>
                {semester.name} ({semester.academic_year})
              </span>
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expanded && (
              <div className="p-4 space-y-6">
                {grades.map((course) => (
                  <CourseRow key={course.offering_id} course={course} />
                ))}

                {summary && Object.keys(summary).length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
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
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

const CourseRow = ({ course }: { course: any }) => {
  const formatScore = (v?: number | null) => (v != null ? v.toFixed(2) : "-");
  const formatList = (arr: number[]) =>
    arr.length ? arr.map((x) => x.toFixed(2)).join(", ") : "-";

  const regular = course.theoryScores
    .filter((s: Grade) => s.score_type === "regular")
    .map((s: Grade) => s.score);
  const midterm = course.theoryScores
    .filter((s: Grade) => s.score_type === "midterm")
    .map((s: Grade) => s.score);
  const final = course.theoryScores
    .filter((s: Grade) => s.score_type === "final")
    .map((s: Grade) => s.score);
  const practice = course.practiceScores.map((s: Grade) => s.score);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg mb-1">
        {course.offering_name}
      </h3>
      <div className="space-y-1 text-sm">
        {regular.length > 0 && (
          <ScoreRow label="Điểm thường kỳ" value={formatList(regular)} />
        )}
        {practice.length > 0 && (
          <ScoreRow label="Điểm thực hành" value={formatList(practice)} />
        )}
        {midterm.length > 0 && (
          <ScoreRow label="Điểm giữa kỳ" value={formatList(midterm)} />
        )}
        {final.length > 0 && (
          <ScoreRow label="Điểm cuối kỳ" value={formatList(final)} />
        )}
      </div>

      {course.summary ? (
        <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 space-y-1 text-sm">
          <ScoreRow label="Thang điểm 4" value={formatScore(course.summary.gpa4)} />
          <ScoreRow label="Điểm chữ" value={course.summary.letter_grade} />
          <ScoreRow
            label="Xếp loại"
            value={getClassificationLabel(course.summary.classification)}
          />
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300 text-sm mr-2">
              Kết quả:
            </span>
            {course.summary.passed ? (
              <span className="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                <CheckCircle size={18} />
                Đạt
              </span>
            ) : (
              <span className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                <XCircle size={18} />
                Không đạt
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="italic text-gray-500 dark:text-gray-400 text-sm mt-2">
          Chưa có tổng kết
        </p>
      )}
    </div>
  );
};

const ScoreRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex justify-between text-gray-700 dark:text-gray-300">
    <span>{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);
