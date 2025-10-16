import React from "react";

interface GradeSummaryStatsProps {
  grades: any[];
}

export const GradeSummaryStats: React.FC<GradeSummaryStatsProps> = ({ grades }) => {
  if (!grades || grades.length === 0) return null;

  const validGrades = grades.filter(
    g => (g.theoryScores && g.theoryScores.length > 0) || (g.practiceScores && g.practiceScores.length > 0)
  );

  const gradedStudents = validGrades.filter(g => g.summary);

  const ungradedStudents = validGrades.filter(g => !g.summary);

  const totalStudents = gradedStudents.length;

  const avgTheory =
    gradedStudents.reduce((acc, g) => {
      const scores = g.theoryScores || [];
      const total = scores.reduce((a: number, s: any) => a + (s.score || 0), 0);
      return acc + (scores.length > 0 ? total / scores.length : 0);
    }, 0) / (totalStudents || 1);

  const avgPractice =
    gradedStudents.reduce((acc, g) => {
      const scores = g.practiceScores || [];
      const total = scores.reduce((a: number, s: any) => a + (s.score || 0), 0);
      return acc + (scores.length > 0 ? total / scores.length : 0);
    }, 0) / (totalStudents || 1);

  const avgTotal =
    gradedStudents.reduce((acc, g) => acc + (g.summary?.total_score || 0), 0) / (totalStudents || 1);

  const passedCount = gradedStudents.filter(g => g.summary?.passed).length;
  const failedCount = gradedStudents.filter(g => g.summary && !g.summary?.passed).length;

  const notEligibleCount = gradedStudents.filter(g => {
    const midterm = g.theoryScores?.find((s: any) => s.type === "midterm")?.score ?? null;
    return midterm !== null && midterm < 1;
  }).length;

  const gradeDistribution: Record<string, number> = {};
  gradedStudents.forEach(g => {
    const grade = g.summary?.letter_grade || "Chưa xếp loại";
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
  });

  return (
    <div className="mt-6 p-4 border rounded-lg bg-background space-y-3">
      <h4 className="text-lg font-semibold">Thống kê lớp học phần</h4>
      <div>Số sinh viên đã có xếp loại: {totalStudents}</div>
      <div>Số sinh viên chưa xếp loại: {ungradedStudents.length}</div>
      <div>Điểm trung bình lý thuyết: {avgTheory.toFixed(2)}</div>
      <div>Điểm trung bình thực hành: {avgPractice.toFixed(2)}</div>
      <div>Điểm trung bình tổng: {avgTotal.toFixed(2)}</div>
      <div>Số sinh viên đạt: {passedCount}</div>
      <div>Số sinh viên không đạt: {failedCount}</div>
      <div>Số sinh viên không đủ điều kiện thi cuối kỳ: {notEligibleCount}</div>
      <div>
        Phân bố xếp loại:{" "}
        {Object.entries(gradeDistribution).map(([grade, count]) => (
          <span key={grade} className="mr-2">
            {grade}: {count}
          </span>
        ))}
      </div>
    </div>
  );
};
