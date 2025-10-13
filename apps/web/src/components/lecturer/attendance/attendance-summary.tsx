"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info } from "lucide-react";

type Student = {
  id: number;
  student_code: string;
  practice_group_id?: number | null;
  full_name: string;
};

type Attendance = {
  id: number;
  enrollment_id: number | null;
  practice_group_id: number | null;
  attendance_date: string; // ISO
  type: "theory" | "practice" | string;
  status: string;
  note?: string | null;
  enrollment?: { student_id: number };
};

export default function AttendanceSummary() {
  const { id } = useParams();
  const classId = Number(id);

  const [students, setStudents] = useState<Student[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  const lecturer_id = user?.id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        const [res1, res2] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/students?offering_id=${classId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/attendance?lecturer_id=${lecturer_id}&offering_id=${classId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ),
        ]);

        const stuJson = await res1.json();
        const attJson = await res2.json();

        const stuData = stuJson?.data ?? [];
        const attData = attJson?.data ?? [];

        // debug log (xem console)
        console.debug("students api returned:", stuData.length, "items");
        console.debug("attendance api returned:", attData.length, "items");

        setStudents(
          stuData.map((e: any) => ({
            id: e.students.id,
            student_code: e.students.student_code,
            full_name: e.students.users.full_name,
            practice_group_id: e.practice_group_id ?? null,
          }))
        );

        setAttendances(attData as Attendance[]);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        setStudents([]);
        setAttendances([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  if (loading) return <div className="p-6 text-center">Đang tải dữ liệu...</div>;

  // --- Build unique date keys in ISO yyyy-MM-dd format (safe across timezones)
  const dateKeys = Array.from(
    new Set(
      attendances.map((a) => {
        try {
          return format(parseISO(a.attendance_date), "yyyy-MM-dd");
        } catch {
          // fallback if parseISO fails
          return format(new Date(a.attendance_date), "yyyy-MM-dd");
        }
      })
    )
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Helper: format key for header (dd/MM/yyyy)
  const formatKeyForHeader = (key: string) => {
    return format(new Date(key + "T00:00:00"), "dd/MM/yyyy");
  };

  // Helper: get newest attendance for studentId/date/type
  const getNewestRecord = (studentId: number, dateKey: string, type: string) => {
    const records = attendances.filter((a) => {
      const ak = (() => {
        try {
          return format(parseISO(a.attendance_date), "yyyy-MM-dd");
        } catch {
          return format(new Date(a.attendance_date), "yyyy-MM-dd");
        }
      })();
      return (
        ak === dateKey &&
        a.type === type &&
        (a.enrollment?.student_id ?? null) === studentId
      );
    });

    if (records.length === 0) return null;

    // pick the newest by attendance_date
    records.sort((x, y) => {
      const tx = Date.parse(x.attendance_date);
      const ty = Date.parse(y.attendance_date);
      return tx - ty;
    });

    return records[records.length - 1];
  };

  const statusColor: Record<string, string> = {
    present: "bg-green-100 text-green-700",
    absent: "bg-red-100 text-red-700",
    late: "bg-yellow-100 text-yellow-700",
  };

  const statusLabel: Record<string, string> = {
    present: "Có mặt",
    absent: "Vắng",
    late: "Trễ",
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Bảng tổng hợp điểm danh</h1>

      <div className="overflow-x-auto">
        <Table className="border rounded-lg">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-[60px]">STT</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Mã SV</TableHead>
              <TableHead className="text-center w-[100px]">Nhóm TH</TableHead>
              {dateKeys.map((key) => (
                <TableHead key={key} className="text-center">
                  {formatKeyForHeader(key)}
                  <div className="text-xs text-muted-foreground">(LT / TH)</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {students.map((s, idx) => (
              <TableRow key={s.id}>
                <TableCell className="text-center">{idx + 1}</TableCell>
                <TableCell>{s.full_name}</TableCell>
                <TableCell>{s.student_code}</TableCell>
                <TableCell className="text-center">{s.practice_group_id ?? "-"}</TableCell>

                {dateKeys.map((key) => {
                  const theory = getNewestRecord(s.id, key, "theory");
                  const practice = getNewestRecord(s.id, key, "practice");

                  const renderCell = (rec: Attendance | null) => {
                    if (!rec) return "-";
                    const label = statusLabel[rec.status] ?? rec.status;
                    const cls = statusColor[rec.status] ?? "bg-gray-100 text-gray-700";
                    return (
                      <div className="inline-flex items-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Badge className={`cursor-pointer ${cls} px-2 py-0.5`}>
                              {label}
                              {rec.note ? <Info className="ml-1 w-3 h-3 inline-block" /> : null}
                            </Badge>
                          </DialogTrigger>
                          {rec.note && (
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ghi chú</DialogTitle>
                              </DialogHeader>
                              <div className="mt-1 text-sm text-muted-foreground">{rec.note}</div>
                            </DialogContent>
                          )}
                        </Dialog>
                      </div>
                    );
                  };

                  return (
                    <TableCell key={key} className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-xs">LT: {renderCell(theory)}</div>
                        <div className="text-xs">TH: {renderCell(practice)}</div>
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
