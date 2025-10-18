"use client";

import { useEffect, useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookText, Loader2, Search, X } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("");
  const [noteModal, setNoteModal] = useState<{ open: boolean; note?: string }>({ open: false });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [searchText, setSearchText] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());

  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceToday, setAttendanceToday] = useState<Record<number, any>>({});
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editAttendanceOpen, setEditAttendanceOpen] = useState(false);

  const params = useParams();
  const { id } = params;
  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const currentLecturerId = currentUser?.id;

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [offeringRes, attendanceRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/course-offerings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance?lecturer_id=${currentLecturerId}&offering_id=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
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
  };

  useEffect(() => {
    fetchData();
  }, [id, currentLecturerId]);

  useEffect(() => {
    if (!offering) return;
    const isTheoryLecturer = offering.lecturers?.id === currentLecturerId;
    if (isTheoryLecturer) setActiveTab("theory");
    else {
      const myPracticeGroup = offering.practice_groups?.find((g: any) => g.lecturers?.id === currentLecturerId);
      if (myPracticeGroup) setActiveTab(`practice-${myPracticeGroup.id}`);
    }
  }, [offering, currentLecturerId]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchText("");
    setFilteredStudents([]);
    setSelectedStudents(new Set());
  }, [activeTab]);

  if (loading) return (
    <div className="flex justify-center items-center h-full text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải danh sách điểm danh...
    </div>
  )
  if (!offering) return (
    <EmptyState
      icon={<BookText className="w-10 h-10" />}
      text="Không có lớp học phần nào được tìm thấy."
      className="py-1"
    />
  )

  const allStudents = offering.students.map((s: any) => ({
    id: s.students.id,
    studentCode: s.students.student_code,
    fullName: s.students.users.full_name,
  }));

  const theoryDates = Array.from(
    new Set(attendances.filter(a => a.type === "theory").map(a => a.attendance_date.split("T")[0]))
  ).sort();

  const practiceDates = Array.from(
    new Set(attendances.filter(a => a.type === "practice").map(a => a.attendance_date.split("T")[0]))
  ).sort();

  const practiceGroups = offering.practice_groups || [];

  const groupPracticeDatesMap: Record<number, string[]> = {}; 
  practiceGroups.forEach(pg => {
    const groupDates = Array.from(
      new Set(
        attendances
          .filter(a => a.type === "practice" && a.practice_group_id === pg.id)
          .map(a => a.attendance_date.split("T")[0])
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
      return { key: `practice-${g.id}`, label: `Nhóm thực hành ${g.group_number}`, students: groupStudents, groupId: g.id, dates: groupPracticeDatesMap[g.id] || [] };
    }),
  ];

  const sortByLastName = (students: typeof allStudents) => {
    return [...students].sort((a, b) => {
      const lastNameA = a.fullName.split(" ").slice(-1)[0].toLowerCase();
      const lastNameB = b.fullName.split(" ").slice(-1)[0].toLowerCase();
      return lastNameA.localeCompare(lastNameB);
    });
  };

  const getPaginatedStudents = (students: typeof allStudents, page: number, pageSize: number) => {
    const startIdx = (page - 1) * pageSize;
    return students.slice(startIdx, startIdx + pageSize);
  };

  const handleSearch = (students: typeof allStudents) => {
    setIsLoading(true);
    setTimeout(() => {
      const normalizedQuery = normalize(searchText); 
      const filtered = students.filter((s) =>
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

  const toggleSelectAll = (students: typeof allStudents) => {
    const allIds = students.map((s) => s.id);
    const allSelected = allIds.every((id) => selectedStudents.has(id));
    const newSet = new Set(selectedStudents);
    if (allSelected) allIds.forEach((id) => newSet.delete(id));
    else allIds.forEach((id) => newSet.add(id));
    setSelectedStudents(newSet);
  };

  const fetchTodayAttendance = async (type: "theory" | "practice", groupId?: number) => {
    try {
      setAttendanceLoading(true);
      const token = localStorage.getItem("token");
      const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
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
    // await fetchTodayAttendance(type, groupId);
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
    map[e.students.id] = e.id; // student_id -> enrollment_id
    return map;
  }, {} as Record<number, number>);

  const practiceGroupMap: Record<number, number> = {};
  practiceGroups.forEach(pg => {
    pg.students.forEach(pe => {
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

      console.table(records);

      const responses = await Promise.all(
        records.map(async (r, i) => {
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
            const data = await res.json();
            return data;
          } else {
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
            if (!res.ok) {
              throw new Error(`Lỗi ${res.status}`);
            }
            const data = await res.json();
            return data;
          }
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
    } catch (error) {
      toast.error("Có lỗi xảy ra khi lưu điểm danh");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentGroup = groupTabs.find(g => g.key === activeTab);
  const modalStudents = selectedStudents.size > 0
    ? currentGroup?.students.filter(s => selectedStudents.has(s.id)) || []
    : currentGroup?.students || [];

  return (
    <div className="space-y-10">
      <PageBreadcrumb
        items={[
          { label: "Lớp học phần", href: "/lecturer/classes" },
          { label: offering.name, href: `/lecturer/classes/${offering.id}` },
          { label: "Danh sách điểm danh" },
        ]}
      />

      <h2 className="text-lg font-semibold mb-4">
        Danh sách điểm danh của lớp {offering.name} ({offering.class_code})
      </h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {groupTabs.map((g) => (
            <TabsTrigger key={g.key} value={g.key}>{g.label}</TabsTrigger>
          ))}
        </TabsList>

        {groupTabs.map((group) => {
          let students = filteredStudents.length > 0 ? filteredStudents : group.students;
          const sortedStudents = sortByLastName(students);
          const paginatedStudents = getPaginatedStudents(sortedStudents, currentPage, pageSize);

          return (
            <TabsContent key={group.key} value={group.key}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2 items-center">
                  <div className="relative w-64">
                    <Input
                      placeholder="Tìm theo tên hoặc MSSV"
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="pr-8"
                    />
                    {searchText && (
                      <button
                        type="button"
                        onClick={() => setSearchText("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <Button onClick={() => handleSearch(group.students)}>
                    <Search className="w-4 h-4 mr-2" /> Tìm kiếm
                  </Button>

                  {hasSearched && (
                    <Button variant="destructive" onClick={handleResetSearch}>
                      Xóa tìm kiếm
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={() => openAttendance(group.key === "theory" ? "theory" : "practice", "groupId" in group ? group.groupId : undefined)}>
                    Điểm danh hôm nay
                  </Button>
                  <Button variant="secondary" onClick={() => setEditAttendanceOpen(true)}>
                    Chỉnh sửa điểm danh
                  </Button>
                </div>
              </div>

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
                totalItems={hasSearched ? filteredStudents.length : students.length}
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
  );
}
