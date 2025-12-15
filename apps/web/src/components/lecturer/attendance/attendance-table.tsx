"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Info, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface AttendanceRecord {
  id: number;
  attendance_date: string;
  status: "present" | "absent" | "late" | "excused";
  note?: string;
  type: "theory" | "practice";
  practice_group_id?: number | null;
  enrollment: { student_id: number };
}

interface Student {
  id: number;
  studentCode: string;
  fullName: string;
}

interface Group {
  key: string;
  groupId?: number;
  dates: string[];
}

interface AttendanceTableProps {
  students: Student[];
  attendanceMap: Record<number, Record<string, AttendanceRecord[]>>;
  group: Group;
  currentPage: number;
  pageSize: number;
  selectedStudents: Set<number>;
  toggleSelectStudent: (id: number) => void;
  toggleSelectAll: (students: Student[]) => void;
  onOpenNote: (note?: string) => void;
  loading?: boolean;
}

export default function AttendanceTable({
  students,
  attendanceMap,
  group,
  currentPage,
  pageSize,
  selectedStudents,
  toggleSelectStudent,
  toggleSelectAll,
  onOpenNote,
  loading = false,
}: AttendanceTableProps) {
  const formatVNDate = (dateStr: string) =>
    format(parseISO(dateStr), "dd/MM/yyyy", { locale: vi });

  const getBadge = (status: AttendanceRecord["status"]) => {
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

  const allSelected =
    students.length > 0 && students.every((s) => selectedStudents.has(s.id));

  const stickyCell =
    "sticky bg-background z-20 shadow-[1px_0_0_0_#e5e7eb] dark:shadow-[1px_0_0_0_#334155]";

  return (
    <div className="relative overflow-x-auto">
      <Table
        className={`mt-4 min-w-max transition-opacity ${
          loading ? "opacity-50 pointer-events-none" : "opacity-100"
        }`}
      >
        <TableHeader>
          <TableRow>
            <TableHead className={`left-0 w-[48px] ${stickyCell}`}>
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => toggleSelectAll(students)}
                disabled={loading}
              />
            </TableHead>

            <TableHead className={`left-[48px] w-[48px] ${stickyCell}`}>
              STT
            </TableHead>

            <TableHead className={`left-[96px] w-[84px] ${stickyCell}`}>
              MSSV
            </TableHead>

            <TableHead className={`left-[180px] w-[180px] ${stickyCell}`}>
              Họ và tên
            </TableHead>

            {group.dates.map((d) => (
              <TableHead
                key={d}
                className="min-w-[120px] text-center border-b"
              >
                {formatVNDate(d)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4 + group.dates.length}
                className="text-center text-muted-foreground"
              >
                Không có sinh viên nào
              </TableCell>
            </TableRow>
          ) : (
            students.map((s, idx) => (
              <TableRow key={s.id}>
                <TableCell className={`left-0 w-[48px] ${stickyCell}`}>
                  <Checkbox
                    checked={selectedStudents.has(s.id)}
                    onCheckedChange={() => toggleSelectStudent(s.id)}
                    disabled={loading}
                  />
                </TableCell>

                <TableCell className={`left-[48px] w-[48px] ${stickyCell}`}>
                  {(currentPage - 1) * pageSize + idx + 1}
                </TableCell>

                <TableCell className={`left-[96px] w-[84px] ${stickyCell}`}>
                  {s.studentCode}
                </TableCell>

                <TableCell
                  className={`left-[180px] w-[180px] ${stickyCell} whitespace-nowrap`}
                >
                  {s.fullName}
                </TableCell>

                {group.dates.map((date) => {
                  const records = attendanceMap[s.id]?.[date] || [];
                  const record = records.find((r) =>
                    group.key === "theory"
                      ? r.type === "theory"
                      : group.groupId &&
                        r.practice_group_id === group.groupId
                  );

                  return (
                    <TableCell
                      key={date}
                      className="min-w-[120px] text-center"
                    >
                      {record ? (
                        <div className="flex items-center justify-center gap-1">
                          {getBadge(record.status)}
                          {record.note && (
                            <Info
                              className="w-4 h-4 text-muted-foreground cursor-pointer"
                              onClick={() =>
                                !loading && onOpenNote(record.note)
                              }
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

      {loading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm rounded-md">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      )}
    </div>
  );
}
