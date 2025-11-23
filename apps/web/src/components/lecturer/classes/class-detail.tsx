"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  GraduationCap,
  Users,
  BookOpen,
  CalendarRange,
  Loader2,
  BookText,
} from "lucide-react";
import WeeklyScheduleList from "@/components/lecturer/classes/weekly-schedule-list";
import PracticeGroupCard from "./practice-group-card";
import { Student } from "@packages/core/entities/Student";
import { Enrollment } from "@packages/core/entities/Enrollment";
import { PracticeGroup } from "@packages/core/entities/PracticeGroup";
import { Offering } from "@packages/core/entities/CourseOffering";
import { StudentTable } from "./student-table";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/empty-state";
import { CreateNotificationModal } from "./CreateNotificationModal";

function mapGroupStudents(group: PracticeGroup, enrollments: Enrollment[]): Student[] {
  return group.students
    .map((gs) => {
      const found = enrollments.find((e) => e.id === gs.enrollment_id);
      return found?.students;
    })
    .filter((s): s is Student => !!s);
}

export default function ClassDetail() {
  const params = useParams();
  const { id } = params;

  const [offering, setOffering] = useState<Offering | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("theory");
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  const router = useRouter();
  const [currentLecturerId, setCurrentLecturerId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      setCurrentLecturerId(user?.id);
    }
  }, []);
  const isTheoryLecturer = offering?.lecturers?.id === currentLecturerId;

  const myPracticeGroup = offering?.practice_groups?.find(
    (g) => g.lecturers?.id === currentLecturerId
  );
  const isPracticeOnly = !isTheoryLecturer && !!myPracticeGroup;

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

  const summaryStats = useMemo(() => {
    if (!offering) {
      return {
        totalStudents: 0,
        capacity: 0,
        registered: 0,
        occupancy: 0,
        practiceGroupCount: 0,
        practiceStudentCount: 0,
      };
    }

    const capacity = Number(offering.capacity) || 0;
    const registered = Number(offering.registered) || 0;
    const practiceGroups = offering.practice_groups ?? [];
    const practiceStudentCount = practiceGroups.reduce(
      (sum, group) => sum + (group.students?.length ?? 0),
      0
    );
    const totalStudents =
      offering.students?.reduce(
        (sum, enrollment) => sum + (enrollment.students ? 1 : 0),
        0
      ) ?? 0;
    const occupancy = capacity > 0 ? Math.round((registered * 100) / capacity) : 0;

    return {
      totalStudents,
      capacity,
      registered,
      occupancy,
      practiceGroupCount: practiceGroups.length,
      practiceStudentCount,
    };
  }, [offering]);

  if (loading) {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
        <div className="rounded-3xl border border-border/60 bg-card/40 p-10 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Đang tải thông tin chi tiết lớp học phần...
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

  const practiceGroups = offering.practice_groups ?? [];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
      <div className="space-y-10 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageBreadcrumb
            items={[
              { label: "Lớp học phần", href: "/lecturer/classes" },
              { label: offering.name },
            ]}
          />
          <div className="rounded-full border border-border/60 bg-background/70 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground shadow-inner shadow-black/5">
            {offering.semesters?.academic_year
              ? `Năm học ${offering.semesters.academic_year}`
              : "Chưa rõ năm học"}
          </div>
        </div>

        <Card
          className="group relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/60 p-6 sm:p-8 shadow-[0_24px_80px_-40px_rgba(59,130,246,0.45)] transition-all duration-300 hover:border-primary/40 hover:shadow-[0_32px_100px_-45px_rgba(59,130,246,0.6)]"
          onClick={() => setActiveTab("theory")}
        >
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
                    {offering.courses?.course_code || "Chưa có mã học phần"} · {offering.class_code}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                  {offering.semesters?.name || "Chưa có học kỳ"}
                </span>
                {offering.courses?.credit && (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
                    {offering.courses.credit} tín chỉ
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Giảng viên:</span>{" "}
                <span className="single-ellipsis">
                  {offering.lecturers?.users?.full_name || "Chưa phân công"}
                  {offering.lecturers?.lecturer_code
                    ? ` (${offering.lecturers.lecturer_code})`
                    : ""}
                </span>
              </p>
              <p>
                <span className="font-medium text-foreground">Email:</span>{" "}
                {offering.lecturers?.users?.email || "-"}
              </p>
              <p>
                <span className="font-medium text-foreground">Học kỳ:</span>{" "}
                {offering.semesters?.name || "-"}{" "}
                {offering.semesters?.academic_year
                  ? `(${offering.semesters.academic_year})`
                  : ""}
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-primary/25 bg-background/70 p-4 shadow-inner shadow-primary/5">
              <WeeklyScheduleList
                schedules={offering.weekly_schedules}
                filterType="theory"
                semester={offering.semesters ?? undefined}
              />
            </div>

            {offering.description && (
              <p className="rounded-2xl border border-border/40 bg-background/60 p-4 text-sm italic text-muted-foreground">
                {offering.description}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                  <GraduationCap className="h-4 w-4" />
                  {offering.courses?.credit || "-"} tín chỉ
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 font-medium text-indigo-600">
                  <Users className="h-4 w-4" />
                  {offering.registered || 0}/{offering.capacity || 0} SV
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-2 rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
                  onClick={() => router.push(`/lecturer/classes/${id}/grade`)}
                >
                  <GraduationCap className="h-4 w-4" />
                  Bảng điểm
                </Button>
                <Button
                  size="sm"
                  className="gap-2 rounded-full bg-primary text-primary-foreground shadow-[0_20px_40px_-20px_rgba(59,130,246,0.65)] hover:bg-primary/90"
                  onClick={() => router.push(`/lecturer/classes/${id}/attendance`)}
                >
                  <CalendarRange className="h-4 w-4" />
                  Chi tiết điểm danh
                </Button>
               
              </div>
            </div>
          </div>
        </Card>

        {/* <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="group rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 shadow-[0_24px_80px_-50px_rgba(37,99,235,0.6)] transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_32px_100px_-55px_rgba(37,99,235,0.7)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Tổng sinh viên
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {summaryStats.totalStudents}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {summaryStats.registered} sinh viên đã đăng ký
            </p>
          </div>

          <div className="group rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-5 shadow-[0_24px_80px_-50px_rgba(16,185,129,0.6)] transition hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-[0_32px_100px_-55px_rgba(16,185,129,0.7)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Sức chứa
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {summaryStats.capacity}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {summaryStats.registered}/{summaryStats.capacity} sinh viên tham gia
            </p>
          </div>

          <div className="group rounded-3xl border border-border/60 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent p-5 shadow-[0_24px_80px_-50px_rgba(99,102,241,0.6)] transition hover:-translate-y-1 hover:border-indigo-500/60 hover:shadow-[0_32px_100px_-55px_rgba(99,102,241,0.7)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Tỉ lệ đăng ký
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {summaryStats.capacity > 0 ? `${summaryStats.occupancy}%` : "-"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-600">
                <Info className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {summaryStats.capacity > 0
                ? `${summaryStats.registered}/${summaryStats.capacity} sinh viên`
                : "Chưa có dữ liệu"}
            </p>
          </div>

          <div className="group rounded-3xl border border-border/60 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 shadow-[0_24px_80px_-50px_rgba(245,158,11,0.6)] transition hover:-translate-y-1 hover:border-amber-500/60 hover:shadow-[0_32px_100px_-55px_rgba(245,158,11,0.7)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Nhóm thực hành
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {summaryStats.practiceGroupCount}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {summaryStats.practiceStudentCount} sinh viên tham gia thực hành
            </p>
          </div>
        </div> */}

        {practiceGroups.length > 0 && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Các nhóm thực hành</h3>
                <p className="text-sm text-muted-foreground">
                  Chọn nhóm để xem danh sách sinh viên tương ứng.
                </p>
              </div>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-inner">
                {practiceGroups.length} nhóm
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {practiceGroups.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setActiveTab(`group-${g.group_number}`)}
                  className={`cursor-pointer transition ${
                    !isTheoryLecturer && myPracticeGroup?.id !== g.id
                      ? "pointer-events-none opacity-50"
                      : "hover:-translate-y-1"
                  }`}
                >
                  <PracticeGroupCard
                    groupNumber={g.group_number}
                    lecturerName={g.lecturers?.users?.full_name}
                    lecturerCode={g.lecturers?.lecturer_code}
                    lecturerEmail={g.lecturers?.users?.email}
                    studentCount={g.students?.length || 0}
                    capacity={g.capacity ? Number(g.capacity) : undefined}
                    schedule={g.weekly_schedules}
                    semester={offering.semesters}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">Danh sách sinh viên</h3>
            <div className="rounded-full border border-border/50 bg-background/60 px-4 py-1 text-xs font-medium text-muted-foreground shadow-inner">
              Tổng: {summaryStats.totalStudents} sinh viên
            </div>
          </div>

          {practiceGroups.length > 0 && !isPracticeOnly ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-6">
              <TabsList className="!bg-background/70 !border border-border/60 rounded-full p-1 shadow-inner backdrop-blur">
                <TabsTrigger
                  value="theory"
                  className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                >
                  Lý thuyết
                </TabsTrigger>
                {practiceGroups.map((g) => (
                  <TabsTrigger
                    key={g.id}
                    value={`group-${g.group_number}`}
                    className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                  >
                    Nhóm {g.group_number}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="theory" className="mt-4">
                <div className="rounded-3xl border border-border/60 bg-background/70 p-4 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
                  <StudentTable
                    classId={offering.id}
                    type="theory"
                    enrollments={offering.students
                      .filter((e) => e.students !== undefined)
                      .map((e) => ({ id: e.id, students: e.students as Student }))}
                    practiceGroups={practiceGroups}
                    students={offering.students
                      .map((e) => e.students)
                      .filter((s): s is Student => !!s)}
                  />
                </div>
              </TabsContent>

              {practiceGroups.map((g) => (
                <TabsContent key={g.id} value={`group-${g.group_number}`} className="mt-4">
                  <div className="rounded-3xl border border-border/60 bg-background/70 p-4 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
                    <StudentTable
                      classId={offering.id}
                      type="practice"
                      enrollments={offering.students
                        .filter((e) => e.students !== undefined)
                        .map((e) => ({ id: e.id, students: e.students as Student }))}
                      practiceGroups={practiceGroups}
                      students={mapGroupStudents(g, offering.students)}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : null}

          {isPracticeOnly && myPracticeGroup ? (
            <Tabs value={`group-${myPracticeGroup.group_number}`} className="gap-6">
              <TabsList className="!bg-background/70 !border border-border/60 rounded-full p-1 shadow-inner backdrop-blur">
                <TabsTrigger
                  disabled
                  value={`group-${myPracticeGroup.group_number}`}
                  className="rounded-full px-4 py-1.5 text-sm"
                >
                  Nhóm {myPracticeGroup.group_number}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={`group-${myPracticeGroup.group_number}`} className="mt-4">
                <div className="rounded-3xl border border-border/60 bg-background/70 p-4 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
                  <StudentTable
                    classId={offering.id}
                    type="practice"
                    enrollments={offering.students
                      .filter((e) => e.students !== undefined)
                      .map((e) => ({ id: e.id, students: e.students as Student }))}
                    practiceGroups={practiceGroups}
                    students={mapGroupStudents(myPracticeGroup, offering.students)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          ) : null}

          {offering.practice_group_count === 0 && (
            <div className="rounded-3xl border border-border/60 bg-background/70 p-4 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
              <StudentTable
                classId={offering.id}
                type="theory"
                enrollments={offering.students
                  .filter((e) => e.students !== undefined)
                  .map((e) => ({ id: e.id, students: e.students as Student }))}
                practiceGroups={practiceGroups}
                students={offering.students
                  .map((e) => e.students)
                  .filter((s): s is Student => !!s)}
              />
            </div>
          )}
        </section>
      </div>

      <CreateNotificationModal
        open={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        onSuccess={() => {
          setNotificationModalOpen(false);
          toast.success("Thông báo đã được gửi thành công");
        }}
        selectedStudentIds={
          offering?.students
            ?.map((e) => e.students?.id)
            .filter((id): id is number => id !== undefined) || []
        }
        students={
          offering?.students
            ?.map((e) => e.students)
            .filter((s): s is Student => !!s) || []
        }
      />
    </div>
  );
}
 
