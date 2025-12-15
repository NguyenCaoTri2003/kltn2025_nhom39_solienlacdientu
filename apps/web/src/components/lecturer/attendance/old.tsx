/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, BookText, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { Offering } from "@packages/core/entities/CourseOffering";
import Pagination from "@/components/pagination";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AttendanceTable from "./attendance-table";
import AttendanceModal from "./attendance-modal";
import { Student } from "@packages/core/entities/Student";
import AttendanceEditModal from "./attendance-edit-modal";
import { normalize } from "@/utils/normalize";
import EmptyState from "@/components/empty-state";
import { AttendanceSummaryStats } from "./attendance-summary-stats";
import { Card } from "@/components/ui/card";

interface Attendance {
  id: number;
  attendance_date: string;
  status: "present" | "absent" | "late" | "excused";
  note?: string;
  type: "theory" | "practice";
  practice_group_id?: number | null;
  enrollment: { student_id: number };
}

export default function AttendanceSummary() {
  const [offering, setOffering] = useState<Offering | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("");
  const [noteModal, setNoteModal] = useState<{ open: boolean; note?: string }>({ open: false });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchText, setSearchText] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set<number>());

  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceToday, setAttendanceToday] = useState<Record<number, any>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editAttendanceOpen, setEditAttendanceOpen] = useState(false);

  const params = useParams();
  const { id } = params;
  const currentUser =
    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const currentLecturerId = currentUser?.id;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [offeringRes, attendanceRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/course-offerings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/attendance?lecturer_id=${currentLecturerId}&offering_id=${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      if (!offeringRes.ok || !attendanceRes.ok) throw new Error("Lỗi tải dữ liệu");

      const offeringData = (await offeringRes.json()).data;
      const attendanceData = (await attendanceRes.json()).data;

      setOffering(offeringData);
      setAttendances(attendanceData);
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  }, [id, currentLecturerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!offering) return;
    const isTheoryLecturer = offering.lecturers?.id === currentLecturerId;
    if (isTheoryLecturer) setActiveTab("theory");
    else {
      const myPracticeGroup = offering.practice_groups?.find(
        (g: any) => g.lecturers?.id === currentLecturerId
      );
      if (myPracticeGroup) setActiveTab(`practice-${myPracticeGroup.id}`);
    }
  }, [offering, currentLecturerId]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchText("");
    setFilteredStudents([]);
    setSelectedStudents(new Set());
  }, [activeTab]);

  if (loading) {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
        <div className="rounded-3xl border border-border/60 bg-card/40 p-10 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Đang tải danh sách điểm danh...</p>
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

  const allStudents = offering.students.map((s: any) => ({
    id: s.students.id,
    studentCode: s.students.student_code,
    fullName: s.students.users.full_name,
  }));

  const theoryDates = Array.from(
    new Set(attendances.filter((a) => a.type === "theory").map((a) => a.attendance_date.split("T")[0]))
  ).sort();

  const practiceGroups = offering.practice_groups || [];

  const groupPracticeDatesMap: Record<number, string[]> = {};
  practiceGroups.forEach((pg) => {
    const groupDates = Array.from(
      new Set(
        attendances
          .filter((a) => a.type === "practice" && a.practice_group_id === pg.id)
          .map((a) => a.attendance_date.split("T")[0])
      )
    ).sort();
    groupPracticeDatesMap[pg.id] = groupDates;
  });

  const attendanceMap: Record<number, Record<string, Attendance[]>> = {};
  attendances.forEach((a) => {
    const studentId = a.enrollment?.student_id;
    if (!studentId) return;
    const dateKey = a.attendance_date.split("T")[0];
    if (!attendanceMap[studentId]) attendanceMap[studentId] = {};
    if (!attendanceMap[studentId][dateKey]) attendanceMap[studentId][dateKey] = [];
    attendanceMap[studentId][dateKey].push(a);
  });

  const isTheoryLecturer = offering.lecturers?.id === currentLecturerId;
  const availablePracticeGroups = offering.practice_groups?.filter(
    (g: any) => g.lecturers?.id === currentLecturerId || isTheoryLecturer
  );

  const groupTabs = [
    ...(isTheoryLecturer
      ? [{ key: "theory", label: "Lý thuyết", students: allStudents, dates: theoryDates }]
      : []),
    ...(availablePracticeGroups ?? []).map((g: any) => {
      const studentIds = g.students.map((pgs: any) => pgs.enrollment.student_id);
      const groupStudents = allStudents.filter((s: any) => studentIds.includes(s.id));
      return {
        key: `practice-${g.id}`,
        label: `Nhóm thực hành ${g.group_number}`,
        students: groupStudents,
        groupId: g.id,
        dates: groupPracticeDatesMap[g.id] || [],
      };
    }),
  ];

  const sortByLastName = (students: any[]) => {
    return [...students].sort((a, b) => {
      const lastNameA = a.fullName.split(" ").slice(-1)[0].toLowerCase();
      const lastNameB = b.fullName.split(" ").slice(-1)[0].toLowerCase();
      return lastNameA.localeCompare(lastNameB);
    });
  };

  const getPaginatedStudents = (students: any[], page: number, pageSize: number) => {
    const startIdx = (page - 1) * pageSize;
    return students.slice(startIdx, startIdx + pageSize);
  };

  const handleSearch = (students: any[]) => {
    setIsLoading(true);
    setTimeout(() => {
      const normalizedQuery = normalize(searchText);
      const filtered = students.filter(
        (s) =>
          normalize(s.fullName).includes(normalizedQuery) ||
          normalize(s.studentCode).includes(normalizedQuery)
      );
      setFilteredStudents(filtered);
      setCurrentPage(1);
      setHasSearched(true);
      setIsLoading(false);
    }, 300);
  };

  const handleResetSearch = () => {
    setSearchText("");
    setFilteredStudents([]);
    setCurrentPage(1);
    setHasSearched(false);
    setSelectedStudents(new Set());
  };

  const toggleSelectStudent = (id: number) => {
    const newSet = new Set(selectedStudents);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudents(newSet);
  };

  const toggleSelectAll = (students: any[]) => {
    const allIds = students.map((s) => s.id);
    const allSelected = allIds.every((sid) => selectedStudents.has(sid));
    const newSet = new Set(selectedStudents);
    if (allSelected) allIds.forEach((sid) => newSet.delete(sid));
    else allIds.forEach((sid) => newSet.add(sid));
    setSelectedStudents(newSet);
  };

  const fetchTodayAttendance = async (type: "theory" | "practice", groupId?: number) => {
    try {
      setAttendanceLoading(true);
      const token = localStorage.getItem("token");
      const currentUser =
        typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
      const lecturerId = currentUser?.id;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance?lecturer_id=${lecturerId}&offering_id=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Không thể tải dữ liệu điểm danh.");

      const resData = await res.json();
      const data = resData.data || [];
      const today = new Date().toISOString().split("T")[0];

      const todayMap: Record<number, any> = {};
      data.forEach((record: any) => {
        const recordDate = record.attendance_date?.split("T")[0];
        const isToday = recordDate === today;
        const isSameType = record.type === type;
        const isSameGroup = type === "practice" ? record.practice_group_id === groupId : true;
        if (isToday && isSameType && isSameGroup) todayMap[record.enrollment.student_id] = record;
      });

      setAttendanceToday(todayMap);
    } catch (err) {
      console.error("Lỗi tải danh sách điểm danh:", err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const openAttendance = async (type: "theory" | "practice", groupId?: number) => {
    await fetchTodayAttendance(type, groupId);
    setAttendanceOpen(true);
  };

  const enrollments = offering.students
    .filter((e) => e.students !== undefined)
    .map((e) => ({ id: e.id, students: e.students as Student }));

  const enrollmentToStudentMap: Record<number, number> = {};
  enrollments.forEach((e: any) => {
    enrollmentToStudentMap[e.id] = e.students.id;
  });

  const enrollmentMap = enrollments.reduce((map, e) => {
    map[e.students.id] = e.id;
    return map;
  }, {} as Record<number, number>);

  const practiceGroupMap: Record<number, number> = {};
  practiceGroups.forEach((pg) => {
    pg.students.forEach((pe) => {
      practiceGroupMap[pe.enrollment.student_id] = pg.id;
    });
  });

  const handleAttendanceSubmit = async (records: any[]) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");

      const responses = await Promise.all(
        records.map(async (r) => {
          const studentId = enrollmentToStudentMap[r.enrollment_id];
          const existing = attendanceToday?.[studentId];

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance`, {
            method: existing ? "PATCH" : "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({ offeringId: id, ...(existing ? { id: existing.id } : {}), ...r }),
          });
          if (!res.ok) throw new Error(`Lỗi ${res.status}`);
          return res.json();
        })
      );

      toast.success("Điểm danh thành công", {
        description: `Đã điểm danh ${responses.length} sinh viên.`,
      });

      setAttendanceOpen(false);
      await fetchData();
      setSelectedStudents(new Set());
      setFilteredStudents([]);
      setSearchText("");
      setCurrentPage(1);
      setAttendanceToday({});
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể điểm danh", {
        description: err.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttendanceUpdate = async (records: any[]) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token");

      await Promise.all(
        records.map(async (r) => {
          if (r.id) {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              credentials: "include",
              body: JSON.stringify({
                offeringId: id,
                id: r.id,
                status: r.status,
                note: r.note ?? null,
                attendance_date: r.attendance_date,
                type: r.type,
                practice_group_id: r.practice_group_id ?? null,
              }),
            });
            if (!res.ok) throw new Error(`Lỗi ${res.status}`);
            return res.json();
          }

          const enrollmentId = enrollmentMap[r.student_id] ?? enrollmentMap[r.students?.id] ?? null;
          const payload: any = {
            offeringId: id,
            enrollment_id: enrollmentId,
            status: r.status,
            note: r.note ?? null,
            attendance_date: r.attendance_date,
            type: r.type,
            practice_group_id: r.practice_group_id ?? null,
          };

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`Lỗi ${res.status}`);
          return res.json();
        })
      );

      toast.success("Cập nhật điểm danh thành công!");
      setEditAttendanceOpen(false);
      await fetchData();
      setSelectedStudents(new Set());
      setFilteredStudents([]);
      setSearchText("");
      setCurrentPage(1);
      setAttendanceToday({});
    } catch {
      toast.error("Có lỗi xảy ra khi lưu điểm danh");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentGroup = groupTabs.find((g) => g.key === activeTab);
  const modalStudents = selectedStudents.size > 0
    ? currentGroup?.students.filter((s: any) => selectedStudents.has(s.id)) || []
    : currentGroup?.students || [];

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
      <div className="space-y-10 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <PageBreadcrumb
          items={[
            { label: "Lớp học phần", href: "/lecturer/classes" },
            { label: offering.name, href: `/lecturer/classes/${offering.id}` },
            { label: "Danh sách điểm danh" },
          ]}
        />

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
              <span className="rounded-full border border-border/60 bg-background/70 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground shadow-inner shadow-black/5">
                {offering.semesters?.academic_year
                  ? `Năm học ${offering.semesters.academic_year}`
                  : "Chưa rõ năm học"}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                Giảng viên phụ trách: {" "}
                <span className="font-medium text-foreground">
                  {offering.lecturers?.users?.full_name || "Chưa phân công"}
                </span>
              </span>
              {offering.practice_group_count ? (
                <span>
                  Tổng số nhóm thực hành: {" "}
                  <span className="font-medium text-foreground">
                    {offering.practice_group_count}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="rounded-full border border-border/60 bg-background/70 shadow-inner backdrop-blur">
            {groupTabs.map((g) => (
              <TabsTrigger
                key={g.key}
                value={g.key}
                className="rounded-full data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
              >
                {g.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {groupTabs.map((group) => {
            const baseStudents = filteredStudents.length > 0 ? filteredStudents : group.students;
            const sortedStudents = sortByLastName(baseStudents);
            const paginatedStudents = getPaginatedStudents(sortedStudents, currentPage, pageSize);

            return (
              <TabsContent key={group.key} value={group.key} className="space-y-6">
                <div className="rounded-3xl border border-border/60 bg-card/60 p-4 sm:p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative w-full sm:w-60">
                        <Input
                          placeholder="Tìm theo tên hoặc MSSV"
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="h-10 rounded-full border border-border/50 bg-background/70 pr-10 shadow-[0_12px_32px_-24px_rgba(15,23,42,0.6)]"
                        />
                        {searchText && (
                          <button
                            type="button"
                            onClick={() => setSearchText("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <Button
                        onClick={() => handleSearch(group.students)}
                        className="rounded-full"
                      >
                        <Search className="w-4 h-4 mr-2" /> Tìm kiếm
                      </Button>

                      {hasSearched && (
                        <Button
                          variant="destructive"
                          onClick={handleResetSearch}
                          className="rounded-full"
                        >
                          Xóa tìm kiếm
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() =>
                          openAttendance(
                            group.key === "theory" ? "theory" : "practice",
                            "groupId" in group ? (group as { groupId: number }).groupId : undefined
                          )
                        }
                        className="rounded-full"
                      >
                        Điểm danh hôm nay
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setEditAttendanceOpen(true)}
                        className="rounded-full"
                      >
                        Chỉnh sửa điểm danh
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <AttendanceTable
                      students={hasSearched ? filteredStudents : paginatedStudents}
                      attendanceMap={attendanceMap}
                      group={group}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      selectedStudents={selectedStudents}
                      toggleSelectStudent={toggleSelectStudent}
                      toggleSelectAll={toggleSelectAll}
                      onOpenNote={(note) => setNoteModal({ open: true, note })}
                      loading={isSubmitting || isLoading || attendanceLoading}
                    />
                    <Pagination
                      totalItems={hasSearched ? filteredStudents.length : baseStudents.length}
                      pageSize={pageSize}
                      currentPage={currentPage}
                      onChange={setCurrentPage}
                      item="sinh viên"
                    />
                  </div>
                </div>

                <AttendanceSummaryStats
                  students={group.students}
                  attendanceMap={attendanceMap}
                  group={group}
                />
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Modal ghi chú */}
        <Dialog open={noteModal.open} onOpenChange={(open: any) => setNoteModal({ open })}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Ghi chú điểm danh</DialogTitle>
            </DialogHeader>
            <p className="mt-2">{noteModal.note || "Không có ghi chú"}</p>
          </DialogContent>
        </Dialog>

        {/* Modal điểm danh */}
        <AttendanceModal
          open={attendanceOpen}
          onClose={() => setAttendanceOpen(false)}
          students={modalStudents}
          type={activeTab === "theory" ? "theory" : "practice"}
          enrollmentMap={enrollments.reduce((map, e) => {
            map[e.students.id] = e.id;
            return map;
          }, {} as Record<number, number>)}
          practiceGroupMap={practiceGroupMap}
          attendanceToday={attendanceToday}
          loadingAttendance={attendanceLoading}
          onSubmit={handleAttendanceSubmit}
        />

        {/* Modal chỉnh sửa điểm danh */}
        <AttendanceEditModal
          open={editAttendanceOpen}
          onClose={() => setEditAttendanceOpen(false)}
          offeringId={Number(id)}
          lecturerId={currentLecturerId}
          type={activeTab === "theory" ? "theory" : "practice"}
          groupId={currentGroup && "groupId" in currentGroup ? (currentGroup as { groupId: any }).groupId : undefined}
          students={modalStudents}
          enrollmentMap={enrollments.reduce((map, e) => {
            map[e.students.id] = e.id;
            return map;
          }, {} as Record<number, number>)}
          onSubmit={handleAttendanceUpdate}
        />
      </div>
    </div>
  );
}