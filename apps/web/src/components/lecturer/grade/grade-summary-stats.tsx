import React from "react";

interface GradeSummaryStatsProps {
  grades: any[];
}

export const GradeSummaryStats: React.FC<GradeSummaryStatsProps> = ({ grades }) => {
  if (!grades || grades.length === 0) return null;

  const validGrades = grades.filter(
    (g) =>
      (g.theoryScores && g.theoryScores.length > 0) ||
      (g.practiceScores && g.practiceScores.length > 0)
  );

  const gradedStudents = validGrades.filter((g) => g.summary);

  const ungradedStudents = validGrades.filter((g) => !g.summary);

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
    gradedStudents.reduce((acc, g) => acc + (g.summary?.total_score || 0), 0) /
    (totalStudents || 1);

  const passedCount = gradedStudents.filter((g) => g.summary?.passed).length;
  const failedCount = gradedStudents.filter((g) => g.summary && !g.summary?.passed).length;

  const notEligibleCount = gradedStudents.filter((g) => {
    const midterm = g.theoryScores?.find((s: any) => s.type === "midterm")?.score ?? null;
    return midterm !== null && midterm < 1;
  }).length;

  const gradeDistribution: Record<string, number> = {};
  gradedStudents.forEach((g) => {
    const grade = g.summary?.letter_grade || "Chưa xếp loại";
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
  });

  return (
    <div className="rounded-3xl border border-border/60 bg-card/60 p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-foreground">Thống kê lớp học phần</h4>
          <p className="text-sm text-muted-foreground">
            Tổng quan chi tiết về tiến độ chấm điểm và phân bố kết quả.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Đã xếp loại
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{totalStudents}</p>
          <p className="text-xs text-muted-foreground">
            {passedCount} đạt · {failedCount} không đạt
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Chưa xếp loại
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{ungradedStudents.length}</p>
          <p className="text-xs text-muted-foreground">
            {notEligibleCount} chưa đủ điều kiện thi cuối kỳ
          </p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Điểm trung bình lý thuyết
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{avgTheory.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-background/70 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Điểm trung bình thực hành
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{avgPractice.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-border/60 bg-background/60 px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Phân bố xếp loại
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(gradeDistribution).map(([grade, count]) => (
            <span
              key={grade}
              className="rounded-full border border-border/50 bg-card/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm"
            >
              {grade}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/50 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
        Điểm trung bình tổng của lớp: {" "}
        <span className="font-semibold text-foreground">{avgTotal.toFixed(2)}</span>
      </div>
    </div>
  );
};
