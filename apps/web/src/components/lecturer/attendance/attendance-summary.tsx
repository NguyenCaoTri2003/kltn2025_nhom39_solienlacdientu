"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { Offering } from "@packages/core/entities/CourseOffering";

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
  const params = useParams();
  const { id } = params;
  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const currentLecturerId = currentUser?.id;

  useEffect(() => {
    const fetchData = async () => {
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
        toast.error("Không thể tải dữ liệu điểm danh");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, currentLecturerId]);

  useEffect(() => {
    if (!offering) return;

    const isTheoryLecturer = offering.lecturers?.id === currentLecturerId;

    if (isTheoryLecturer) {
      setActiveTab("theory");
    } else {
      const myPracticeGroup = offering.practice_groups?.find(
        (g: any) => g.lecturers?.id === currentLecturerId
      );
      if (myPracticeGroup) {
        setActiveTab(`practice-${myPracticeGroup.id}`);
      }
    }
  }, [offering, currentLecturerId]);

  if (loading) return <div className="p-4">Đang tải...</div>;
  if (!offering) return <div className="p-4">Không tìm thấy lớp học phần</div>;

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
      ? [
        {
          key: "theory",
          label: "Lý thuyết",
          students: allStudents,
          dates: theoryDates,
        },
      ]
      : []),
    ...(availablePracticeGroups ?? []).map((g: any) => {
      const studentIds = g.students.map((pgs: any) => pgs.enrollment.student_id);
      const groupStudents = allStudents.filter((s: any) => studentIds.includes(s.id));
      return {
        key: `practice-${g.id}`,
        label: `Nhóm thực hành ${g.group_number}`,
        students: groupStudents,
        groupId: g.id,
        dates: practiceDates,
      };
    }),
  ];

  const getBadge = (status: Attendance["status"]) => {
    switch (status) {
      case "present":
        return <Badge className="bg-green-100 text-green-700 border border-green-200">Có mặt</Badge>;
      case "absent":
        return <Badge className="bg-red-100 text-red-700 border border-red-200">Vắng</Badge>;
      case "late":
        return <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200">Trễ</Badge>;
      case "excused":
        return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Có phép</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700 border border-gray-200">-</Badge>;
    }
  };

  const formatVNDate = (dateStr: string) => format(parseISO(dateStr), "dd/MM/yyyy", { locale: vi });

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">{offering.name}</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {groupTabs.map((g) => (
            <TabsTrigger key={g.key} value={g.key}>
              {g.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {groupTabs.map((group) => (
          <TabsContent key={group.key} value={group.key}>
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>STT</TableHead>
                  <TableHead>MSSV</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  {group.dates.map((d) => (
                    <TableHead key={d}>{formatVNDate(d)}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3 + group.dates.length} className="text-center">
                      Không có sinh viên nào trong nhóm này
                    </TableCell>
                  </TableRow>
                ) : (
                  group.students.map((s, idx) => (
                    <TableRow key={s.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{s.studentCode}</TableCell>
                      <TableCell>{s.fullName}</TableCell>
                      {group.dates.map((date) => {
                        const records = attendanceMap[s.id]?.[date] || [];
                        const record = records.find((r) =>
                          group.key === "theory"
                            ? r.type === "theory"
                            : "groupId" in group && r.practice_group_id === group.groupId
                        );
                        return (
                          <TableCell key={date}>
                            {record ? (
                              <div className="flex items-center gap-1">
                                {getBadge(record.status)}
                                {record.note && (
                                  <Info
                                    className="w-4 h-4 text-gray-500 cursor-pointer"
                                    onClick={() => setNoteModal({ open: true, note: record.note })}
                                  />
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        ))}
      </Tabs>

      {/* Modal ghi chú */}
      <Dialog open={noteModal.open} onOpenChange={(open: any) => setNoteModal({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ghi chú điểm danh</DialogTitle>
          </DialogHeader>
          <p className="mt-2">{noteModal.note || "Không có ghi chú"}</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
