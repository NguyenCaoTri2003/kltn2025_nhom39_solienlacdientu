"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, BookText, Loader2, Search, X } from "lucide-react";
import { useParams } from "next/navigation";
import { Offering } from "@packages/core/entities/CourseOffering";
import Pagination from "@/components/pagination";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AttendanceTable from "./attendance-table";
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
  const params = useParams();
  const { id } = params;

  const currentUser =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;

  const currentLecturerId = currentUser?.id;

  const [offering, setOffering] = useState<Offering | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [searchText, setSearchText] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);

  const [noteModal, setNoteModal] = useState<{ open: boolean; note?: string }>({
    open: false,
  });

  const [scheduleDates, setScheduleDates] = useState<{
    theoryDates: string[];
    practiceDatesByGroup: Record<number, string[]>;
  }>({
    theoryDates: [],
    practiceDatesByGroup: {},
  });

  // cell đang edit
  const [editingCell, setEditingCell] = useState<{
    studentId: number;
    date: string;
    groupKey: string;
  } | null>(null);

  // cell đang save
  const [savingCell, setSavingCell] = useState<{
    studentId: number;
    date: string;
  } | null>(null);


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const [offeringRes, attendanceRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/course-offerings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/attendance?offering_id=${id}&lecturer_id=${currentLecturerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      setOffering((await offeringRes.json()).data);
      setAttendances((await attendanceRes.json()).data);
    } finally {
      setLoading(false);
    }
  }, [id, currentLecturerId]);

  const fetchSchedules = useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/offering-schedule?offering_id=${id}&lecturer_id=${currentLecturerId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setScheduleDates((await res.json()).data);
  }, [id, currentLecturerId]);

  useEffect(() => {
    fetchData();
    fetchSchedules();
  }, [fetchData, fetchSchedules]);

  useEffect(() => {
    if (!offering) return;
    if (offering.lecturers?.id === currentLecturerId) {
      setActiveTab("theory");
    } else {
      const pg = offering.practice_groups?.find(
        (g: any) => g.lecturers?.id === currentLecturerId
      );
      if (pg) setActiveTab(`practice-${pg.id}`);
    }
  }, [offering, currentLecturerId]);

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

  const attendanceMap: Record<number, Record<string, Attendance[]>> = {};
  attendances.forEach((a) => {
    const sid = a.enrollment.student_id;
    const date = a.attendance_date.split("T")[0];
    attendanceMap[sid] ??= {};
    attendanceMap[sid][date] ??= [];
    attendanceMap[sid][date].push(a);
  });

  const isTheoryLecturer = offering.lecturers?.id === currentLecturerId;

  const groupTabs = [
    ...(isTheoryLecturer
      ? [
        {
          key: "theory",
          label: "Lý thuyết",
          students: allStudents,
          dates: scheduleDates.theoryDates,
        },
      ]
      : []),
    ...(offering.practice_groups ?? [])
      .filter(
        (g: any) =>
          g.lecturers?.id === currentLecturerId || isTheoryLecturer
      )
      .map((g: any) => ({
        key: `practice-${g.id}`,
        label: `Nhóm TH ${g.group_number}`,
        groupId: g.id,
        students: allStudents.filter((s) =>
          g.students.some((pgs: any) => pgs.enrollment.student_id === s.id)
        ),
        dates: scheduleDates.practiceDatesByGroup[g.id] || [],
      })),
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
    const q = normalize(searchText);
    setFilteredStudents(
      students.filter(
        (s) =>
          normalize(s.fullName).includes(q) ||
          normalize(s.studentCode).includes(q)
      )
    );
    setHasSearched(true);
    setCurrentPage(1);
  };

  const handleResetSearch = () => {
    setSearchText("");
    setFilteredStudents([]);
    setHasSearched(false);
  };

  const saveAttendance = async (
    studentId: number,
    date: string,
    status: "present" | "absent" | "late" | "excused",
    group: any
  ) => {
    try {
      setSavingCell({ studentId, date });

      const token = localStorage.getItem("token");

      const payload = {
        offering_id: Number(id),
        student_id: studentId,
        attendance_date: date,
        status,
        type: group.key === "theory" ? "theory" : "practice",
        practice_group_id:
          group.key.startsWith("practice-")
            ? Number(group.key.split("-")[1])
            : null,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      setAttendances((prev) => {
        const filtered = prev.filter(
          (a) =>
            !(
              a.enrollment.student_id === studentId &&
              a.attendance_date.startsWith(date) &&
              a.type === payload.type &&
              a.practice_group_id === payload.practice_group_id
            )
        );
        return [...filtered, json.data];
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCell(null);
      setEditingCell(null);
    }
  };

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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="rounded-full border border-border/60 bg-background/70 shadow-inner backdrop-blur">
            {groupTabs.map((g) => (
              <TabsTrigger key={g.key} value={g.key} className="rounded-full data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
                {g.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {groupTabs.map((group) => {
            const baseStudents = hasSearched
              ? filteredStudents
              : group.students;

            const sortedStudents = sortByLastName(baseStudents);

            const students = getPaginatedStudents(sortedStudents, currentPage, pageSize);

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
                  </div>

                  {/* <AttendanceTable
                    students={students}
                    attendanceMap={attendanceMap}
                    group={group}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    selectedStudents={new Set()}
                    toggleSelectStudent={() => { }}
                    toggleSelectAll={() => { }}
                    onOpenNote={(note) =>
                      setNoteModal({ open: true, note })
                    }
                  /> */}

                  <AttendanceTable
                    students={students}
                    attendanceMap={attendanceMap}
                    group={group}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    selectedStudents={new Set()}
                    toggleSelectStudent={() => { }}
                    toggleSelectAll={() => { }}
                    loading={loading}
                    editingCell={editingCell}
                    savingCell={savingCell}
                    onStartEdit={(studentId, date) =>
                      setEditingCell({ studentId, date, groupKey: group.key })
                    }
                    onSave={(studentId, date, status) =>
                      saveAttendance(studentId, date, status, group)
                    }
                    onOpenNote={(note) => setNoteModal({ open: true, note })}
                  />

                  <Pagination
                    totalItems={baseStudents.length}
                    pageSize={pageSize}
                    currentPage={currentPage}
                    onChange={setCurrentPage}
                    item="sinh viên"
                  />

                  <AttendanceSummaryStats
                    students={group.students}
                    attendanceMap={attendanceMap}
                    group={group}
                  />
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Note modal */}
        <Dialog
          open={noteModal.open}
          onOpenChange={(open) => setNoteModal({ open })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ghi chú điểm danh</DialogTitle>
            </DialogHeader>
            <p>{noteModal.note || "Không có ghi chú"}</p>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
