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
  availableDates: string[];
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
  availableDates,
}: AttendanceEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [records, setRecords] = useState<Record<number, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (availableDates.length > 0) {
      setSelectedDate((prev) => (prev && availableDates.includes(prev) ? prev : availableDates[0]));
    } else {
      setSelectedDate("");
    }
  }, [open, availableDates]);

  useEffect(() => {
    if (!selectedDate || !open) {
      setRecords({});
      return;
    }

    const loadAttendanceForDate = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/attendance?lecturer_id=${lecturerId}&offering_id=${offeringId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Không thể tải dữ liệu điểm danh");
        const data = (await res.json()).data ?? [];

        // Lọc attendance cho ngày hiện tại
        const filtered = data.filter((r: any) => {
          if (!r.attendance_date) return false;
          const dateOnly = r.attendance_date.split("T")[0];
          if (dateOnly !== selectedDate) return false;
          if (r.type !== type) return false;
          if (type === "practice" && groupId != null) return r.practice_group_id === groupId;
          return true;
        });

        // Map theo studentId
        const byStudent: Record<number, any> = {};
        filtered.forEach((r: any) => {
          const sid =
            r.enrollment?.student_id ??
              r.student_id ??
              (r.enrollment && r.enrollment.student && r.enrollment.student.id)
              ? r.enrollment?.student_id ?? r.enrollment?.student?.id
              : undefined;
          const studentId = Number(sid);
          if (studentId) byStudent[studentId] = r;
        });

        // Chuẩn hóa records cho tất cả sinh viên
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
        toast.error("Lỗi tải dữ liệu điểm danh cho ngày này.");
      } finally {
        setLoading(false);
      }
    };

    loadAttendanceForDate();
  }, [selectedDate, type, groupId, offeringId, lecturerId, open]);

  useEffect(() => {
    if (!open || !selectedDate) return;

    setRecords(prev => {
      const next: Record<number, any> = {};

      students.forEach(s => {
        next[s.id] = prev[s.id] ?? {
          student: s,
          status: undefined,
          note: "",
          enrollment_id: enrollmentMap?.[s.id] ?? null,
          type,
          practice_group_id: type === "practice" ? groupId ?? null : null,
          attendance_date: selectedDate,
        };
      });

      return next;
    });
  }, [students, enrollmentMap]);

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
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Sửa điểm danh</DialogTitle>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto">
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
                    {availableDates.length === 0 ? (
                      <SelectItem value={format(new Date(), "yyyy-MM-dd")}>
                        {format(new Date(), "dd/MM/yyyy")} (Ngày mới)
                      </SelectItem>
                    ) : (
                      availableDates.map((d) => (
                        <SelectItem key={d} value={d}>
                          {format(new Date(d), "dd/MM/yyyy")}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Chọn một trạng thái để áp dụng cho tất cả sinh viên trong ngày này. Bạn vẫn có thể chỉnh sửa riêng từng người bên dưới.
                </p>

                <div className="flex flex-wrap gap-2">
                  {["present", "absent", "late", "excused"].map((status) => {
                    const labelMap: Record<string, string> = {
                      present: "Có mặt",
                      absent: "Vắng",
                      late: "Đi trễ",
                      excused: "Có phép",
                    };
                    const colorMap: Record<string, string> = {
                      present: "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
                      absent: "bg-red-100 text-red-800 border-red-300 hover:bg-red-200",
                      late: "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200",
                      excused: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200",
                    };

                    return (
                      <button
                        key={status}
                        type="button"
                        className={`px-4 py-1 cursor-pointer rounded-lg font-medium border shadow-sm transition-colors duration-200 ${colorMap[status]}`}
                        onClick={() => {
                          setRecords((prev) => {
                            const next: typeof prev = {};
                            Object.keys(prev).forEach((studentId) => {
                              next[Number(studentId)] = {
                                ...prev[Number(studentId)],
                                status,
                              };
                            });
                            return next;
                          });
                        }}
                      >
                        {labelMap[status]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bảng điểm danh */}
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-2 bg-background">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button onClick={handleSave} disabled={saving || !selectedDate}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Lưu thay đổi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
