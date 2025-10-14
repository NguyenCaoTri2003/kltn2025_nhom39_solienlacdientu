"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface StudentItem {
  id: number;
  fullName: string;
  studentCode: string;
}

interface AttendanceEditModalProps {
  open: boolean;
  onClose: () => void;
  offeringId: number;
  lecturerId: number;
  type: "theory" | "practice";
  groupId?: number;
  students: StudentItem[];
  enrollmentMap: Record<number, number>;
  onSubmit: (records: any[]) => Promise<void>;
}

export default function AttendanceEditModal({
  open,
  onClose,
  offeringId,
  lecturerId,
  type,
  groupId,
  students,
  enrollmentMap,
  onSubmit,
}: AttendanceEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [records, setRecords] = useState<Record<number, any>>({});
  const [saving, setSaving] = useState(false);

  const fetchAllAttendances = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/attendance?lecturer_id=${lecturerId}&offering_id=${offeringId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Không thể tải danh sách ngày");
    const json = await res.json();
    return json.data ?? [];
  };

  useEffect(() => {
    if (!open) return;

    const loadDates = async () => {
      try {
        setLoading(true);
        const data = await fetchAllAttendances();
        const filtered = data.filter((a: any) => {
          if (a.type !== type) return false;
          if (type === "practice" && groupId != null) {
            return a.practice_group_id === groupId;
          }
          return true;
        });
        const availableDates = Array.from(
          new Set(filtered.map((a: any) => (a.attendance_date || "").split("T")[0]))
        )
          .filter(Boolean)
          .sort((a, b) => new Date(b as string).getTime() - new Date(a as string).getTime()); 
        setDates(availableDates as string[]);
        setSelectedDate((prev: any) => {
          if (prev && availableDates.includes(prev)) return prev;
          return availableDates[0] ?? "";
        });
      } catch (err) {
        console.error(err);
        toast.error("Lỗi tải danh sách ngày điểm danh.");
      } finally {
        setLoading(false);
      }
    };

    loadDates();
  }, [open, type, groupId, lecturerId, offeringId]);

  useEffect(() => {
    if (!selectedDate) {
      setRecords({});
      return;
    }

    const loadForDate = async () => {
      try {
        setLoading(true);
        const data = await fetchAllAttendances();
        const filtered = data.filter((r: any) => {
          if (!r.attendance_date) return false;
          const dateOnly = r.attendance_date.split("T")[0];
          if (dateOnly !== selectedDate) return false;
          if (r.type !== type) return false;
          if (type === "practice" && groupId != null) {
            return r.practice_group_id === groupId;
          }
          return true;
        });

        const byStudent: Record<number, any> = {};
        filtered.forEach((r: any) => {
          const sid =
            r.enrollment?.student_id ??
            r.student_id ??
            (r.enrollment && r.enrollment.student && r.enrollment.student.id)
              ? (r.enrollment?.student_id ?? r.enrollment?.student?.id)
              : undefined;
          const studentId = Number(sid);
          if (studentId) {
            byStudent[studentId] = r;
          }
        });

        const newRecords: Record<number, any> = {};
        students.forEach((s) => {
          const exist = byStudent[s.id];
          newRecords[s.id] = {
            id: exist?.id ?? undefined,
            student: s,
            status: exist?.status ?? undefined,
            note: exist?.note ?? "",
            enrollment_id: exist?.enrollment_id ?? enrollmentMap?.[s.id] ?? null,
            type,
            practice_group_id: type === "practice" ? groupId ?? null : null,
            attendance_date: exist?.attendance_date ?? selectedDate,
          };
        });

        setRecords(newRecords);
      } catch (err) {
        console.error(err);
        toast.error("Lỗi tải dữ liệu điểm danh ngày này.");
      } finally {
        setLoading(false);
      }
    };

    loadForDate();
  }, [selectedDate, type, groupId, offeringId, lecturerId, students, enrollmentMap]);

  const sortedStudents = [...students].sort((a, b) => {
    const lastA = a.fullName.trim().split(" ").slice(-1)[0].toLowerCase();
    const lastB = b.fullName.trim().split(" ").slice(-1)[0].toLowerCase();
    return lastA.localeCompare(lastB);
  });

  const handleStatusChange = (studentId: number, status: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {
          enrollment_id: enrollmentMap?.[studentId] ?? null,
          type,
          practice_group_id: groupId ?? null,
          attendance_date: selectedDate,
        }),
        id: prev[studentId]?.id ?? undefined,
        status,
      },
    }));
  };

  const handleNoteChange = (studentId: number, note: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {
          enrollment_id: enrollmentMap?.[studentId] ?? null,
          type,
          practice_group_id: groupId ?? null,
          attendance_date: selectedDate,
        }),
        id: prev[studentId]?.id ?? undefined,
        note,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedDate) {
      toast.error("Vui lòng chọn ngày trước khi lưu.");
      return;
    }

    try {
      setSaving(true);

      const toSubmit = Object.entries(records)
        .map(([studentIdStr, r]) => {
          const studentId = Number(studentIdStr);
          const hasChange = r?.status !== undefined || (r?.note && String(r.note).trim() !== "");
          if (!hasChange && !r?.id) return null;

          return {
            ...(r?.id ? { id: r.id } : {}),
            student_id: studentId, 
            enrollment_id: r?.enrollment_id ?? enrollmentMap?.[studentId] ?? null,
            offeringId,
            status: r?.status ?? null,
            note: r?.note ?? null,
            attendance_date: `${selectedDate}T00:00:00Z`,
            type: r?.type ?? type,
            practice_group_id: r?.practice_group_id ?? (type === "practice" ? groupId ?? null : null),
          };
        })
        .filter(Boolean) as any[];

      if (toSubmit.length === 0) {
        toast.error("Không có thay đổi để lưu.");
        setSaving(false);
        return;
      }

      await onSubmit(toSubmit);
      onClose();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Sửa điểm danh</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải dữ liệu...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chọn ngày */}
            <div>
              <label className="block text-sm font-medium mb-1">Chọn ngày điểm danh</label>
              <Select value={selectedDate} onValueChange={(v: any) => setSelectedDate(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn ngày" />
                </SelectTrigger>
                <SelectContent>
                  {dates.length === 0 ? (
                    <SelectItem value={format(new Date(), "yyyy-MM-dd")}>
                      {format(new Date(), "dd/MM/yyyy")} (Ngày mới)
                    </SelectItem>
                  ) : (
                    dates.map((d) => (
                      <SelectItem key={d} value={d}>
                        {format(new Date(d), "dd/MM/yyyy")}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Bảng sinh viên */}
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MSSV</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-center">Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStudents.map((s) => {
                    const record = records[s.id] ?? {};
                    return (
                      <TableRow key={s.id}>
                        <TableCell>{s.studentCode}</TableCell>
                        <TableCell>{s.fullName}</TableCell>
                        <TableCell className="text-center">
                          <Select
                            value={record?.status ?? ""}
                            onValueChange={(v: any) => handleStatusChange(s.id, v)}
                          >
                            <SelectTrigger className="w-[150px] mx-auto">
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Có mặt</SelectItem>
                              <SelectItem value="absent">Vắng</SelectItem>
                              <SelectItem value="late">Đi trễ</SelectItem>
                              <SelectItem value="excused">Có phép</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <textarea
                            className="w-full max-w-[240px] p-1 border rounded resize-y"
                            rows={2}
                            value={record?.note ?? ""}
                            onChange={(e) => handleNoteChange(s.id, e.target.value)}
                            placeholder="Ghi chú (nếu có)"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose} disabled={saving}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={saving || !selectedDate}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
