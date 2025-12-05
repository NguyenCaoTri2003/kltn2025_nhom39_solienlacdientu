"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Offering } from "@packages/core/entities/CourseOffering";
import { GradeTableCard } from "../classes/grade-table-card";
import { toast } from "sonner";
import {
  Award,
  BarChart3,
  BookOpen,
  BookText,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import EmptyState from "@/components/empty-state";
import { GradeDistributionChart } from "./grade-distribution-chart";
import { GradeSummaryStats } from "./grade-summary-stats";
import { GradePassPieChart } from "./grade-pass-pie-chart";
import { Card } from "@/components/ui/card";

interface LecturerGradeSummaryScore {
  type?: string | null;
  score?: number | null;
}

interface LecturerGradeSummary {
  practice_group_number?: number | null;
  theoryScores?: LecturerGradeSummaryScore[];
  practiceScores?: LecturerGradeSummaryScore[];
  summary?: {
    total_score?: number | null;
    gpa4?: number | null;
    letter_grade?: string | null;
    classification?: string | null;
    passed?: boolean | null;
    note?: string | null;
  } | null;
}

export default function GradeSummary() {
    const params = useParams();
    const { id } = params;

    const [offering, setOffering] = useState<Offering | null>(null);
    const [loading, setLoading] = useState(true);
    const [gradesData, setGradesData] = useState<LecturerGradeSummary[]>([]);
    const [loadingGrades, setLoadingGrades] = useState(false);

  const currentUser =
    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
    const currentLecturerId = currentUser?.id;
    const isTheoryLecturer = offering?.lecturers?.id === currentLecturerId;

    const myPracticeGroup = offering?.practice_groups?.find(
        (g) => g.lecturers?.id === currentLecturerId
    );

    console.log("gradesData:", gradesData);

    useEffect(() => {
        if (!id) return;

        const fetchDetail = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    toast.error("Bạn chưa đăng nhập.");
                    setOffering(null);
                    setLoading(false);
                    return;
                }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/course-offerings/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
        });
                const json = await res.json();
                setOffering(json.returnCode === 0 ? json.data : null);
            } catch (error) {
                console.error("Error fetching class detail:", error);
                setOffering(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const fetchGrades = async () => {
            setLoadingGrades(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/grades/lecturer?offering_id=${id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const json = await res.json();
        if (json.returnCode === 0 && Array.isArray(json.data)) {
          let data = json.data as LecturerGradeSummary[];

                    if (!isTheoryLecturer && myPracticeGroup) {
                        data = data.filter(
              (g) => g.practice_group_number === myPracticeGroup.group_number
                        );
                    }

                    setGradesData(data);
                } else {
                    console.warn("Không lấy được điểm:", json.message);
          setGradesData([]);
                }
            } catch (error) {
                console.error("Error fetching grades:", error);
            } finally {
                setLoadingGrades(false);
            }
        };
        fetchGrades();
    }, [id, isTheoryLecturer, myPracticeGroup]);

  const summaryMetrics = useMemo(() => {
    const total = gradesData.length;
    const gradedStudents = gradesData.filter((g) => g.summary);
    const gradedCount = gradedStudents.length;
    const ungradedCount = Math.max(total - gradedCount, 0);

    const passCount = gradedStudents.filter((g) => g.summary?.passed === true).length;
    const failCount = gradedStudents.filter((g) => g.summary?.passed === false).length;
    const passRate = gradedCount > 0 ? Math.round((passCount * 100) / gradedCount) : 0;

    const avgTotalScore =
      gradedCount > 0
        ? gradedStudents.reduce((acc, g) => acc + (Number(g.summary?.total_score) || 0), 0) /
          gradedCount
        : 0;

    const avgGpa =
      gradedCount > 0
        ? gradedStudents.reduce((acc, g) => acc + (Number(g.summary?.gpa4) || 0), 0) / gradedCount
        : 0;

    const highestScore =
      gradedStudents.reduce(
        (max, g) => Math.max(max, Number(g.summary?.total_score) || 0),
        0
      ) ?? 0;

    return {
      total,
      gradedCount,
      ungradedCount,
      passCount,
      failCount,
      passRate,
      avgTotalScore,
      avgGpa,
      highestScore,
    };
  }, [gradesData]);

  if (loading) {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
        <div className="rounded-3xl border border-border/60 bg-card/40 p-10 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Đang tải danh sách điểm của lớp học phần...
          </p>
        </div>
        </div>
    );
  }

  if (!offering) {
        return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
        <div className="rounded-3xl border border-border/60 bg-card/40 p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <EmptyState
                icon={<BookText className="w-10 h-10" />}
                text="Không có lớp học phần nào được tìm thấy."
            className="py-4"
            />
        </div>
      </div>
        );
  }

    return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
      <div className="space-y-10 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <PageBreadcrumb
                items={[
                    { label: "Lớp học phần", href: "/lecturer/classes" },
                    { label: offering.name, href: `/lecturer/classes/${offering.id}` },
                    { label: "Bảng điểm lớp học phần" },
                ]}
            />
          <span className="rounded-full border border-border/60 bg-background/70 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground shadow-inner shadow-black/5">
            {offering.semesters?.academic_year
              ? `Năm học ${offering.semesters.academic_year}`
              : "Chưa rõ năm học"}
          </span>
        </div>

        <Card className="group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/60 p-6 sm:p-8 shadow-[0_24px_80px_-40px_rgba(59,130,246,0.45)] transition-all duration-300 hover:border-primary/40 hover:shadow-[0_32px_100px_-45px_rgba(59,130,246,0.6)]">
          <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-primary/20 opacity-60 blur-3xl transition-all duration-500 group-hover:scale-125" />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner shadow-primary/20">
                  <BookOpen className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                    {offering.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {offering.class_code}
                    {offering.courses?.course_code ? ` · ${offering.courses.course_code}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {offering.courses?.credit && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                    {offering.courses.credit} tín chỉ
                  </span>
                )}
                {offering.practice_group_count ? (
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600">
                    {offering.practice_group_count} nhóm thực hành
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                Giảng viên phụ trách:{" "}
                <span className="font-medium text-foreground">
                  {offering.lecturers?.users?.full_name || "Chưa phân công"}
                </span>
              </span>
              {offering.semesters?.name && (
                <span>
                  Học kỳ:{" "}
                  <span className="font-medium text-foreground">
                    {offering.semesters.name}
                    {offering.semesters?.academic_year
                      ? ` (${offering.semesters.academic_year})`
                      : ""}
                  </span>
                </span>
              )}
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="group rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 shadow-[0_24px_80px_-50px_rgba(37,99,235,0.6)] transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_32px_100px_-55px_rgba(37,99,235,0.7)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Tổng sinh viên
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{summaryMetrics.total}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {summaryMetrics.ungradedCount} chưa có điểm
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="group rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-5 shadow-[0_24px_80px_-50px_rgba(16,185,129,0.6)] transition hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-[0_32px_100px_-55px_rgba(16,185,129,0.7)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Tỉ lệ đạt
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {summaryMetrics.passRate}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {summaryMetrics.passCount}/{summaryMetrics.gradedCount || 0} sinh viên
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="group rounded-3xl border border-border/60 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent p-5 shadow-[0_24px_80px_-50px_rgba(99,102,241,0.6)] transition hover:-translate-y-1 hover:border-indigo-500/60 hover:shadow-[0_32px_100px_-55px_rgba(99,102,241,0.7)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Điểm trung bình tổng
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {summaryMetrics.avgTotalScore.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cao nhất {summaryMetrics.highestScore.toFixed(2)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="group rounded-3xl border border-border/60 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 shadow-[0_24px_80px_-50px_rgba(245,158,11,0.6)] transition hover:-translate-y-1 hover:border-amber-500/60 hover:shadow-[0_32px_100px_-55px_rgba(245,158,11,0.7)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  GPA trung bình
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {summaryMetrics.avgGpa.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {summaryMetrics.failCount} sinh viên chưa đạt
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                <Award className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative rounded-3xl border border-border/60 bg-card/60 p-4 sm:p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
          {loadingGrades && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-background/70 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          <GradeTableCard grades={gradesData} offeringName={offering.name} />
        </div>

        <GradeSummaryStats grades={gradesData} />

        <div className="grid gap-6 lg:grid-cols-2">
          <GradeDistributionChart grades={gradesData} />
          <GradePassPieChart grades={gradesData} />
        </div>
      </div>
    </div>
  );
}
