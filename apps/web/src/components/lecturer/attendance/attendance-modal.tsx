"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Student } from "@packages/core/entities/Student";
import { X } from "lucide-react";
import { format } from "date-fns";

interface AttendanceModalProps {
  open: boolean;
  onClose: () => void;
  students: { id: number; studentCode: string; fullName: string }[];
  type: string; // 'theory' hoặc 'practice'
  enrollmentMap?: Record<number, number>;
  practiceGroupMap?: Record<number, number>;
  onSubmit: (records: any[]) => Promise<void>;
  attendanceToday?: Record<number, any>; 
  loadingAttendance?: boolean;
}

export default function AttendanceModal({
  open,
  onClose,
  students,
  type,
  enrollmentMap,
  practiceGroupMap,
  onSubmit,
  attendanceToday,
  loadingAttendance,
}: AttendanceModalProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && students.length > 0) {
      const getLastName = (fullName?: string) => {
        if (!fullName) return "";
        const parts = fullName.trim().split(/\s+/);
        return parts[parts.length - 1];
      };

      const sorted = [...students].sort((a, b) => {
        const nameA = getLastName(a.fullName);
        const nameB = getLastName(b.fullName);
        return nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
      });

      setRecords(
        sorted.map((s) => {
          const existing = attendanceToday?.[s.id]; 
          return {
            id: existing?.id || null,
            student: s,
            status: existing?.status || "present",
            note: existing?.note || "",
          };
        })
      );
    }
  }, [open, students, attendanceToday]);

  const handleChange = (index: number, key: "status" | "note", value: string) => {
    setRecords((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: value } : r))
    );
  };

  const handleDelete = (index: number) => {
    setRecords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = records.map((r) => {
        const enrollment_id = enrollmentMap?.[r.student.id];
        const practice_group_id = practiceGroupMap?.[r.student.id];

        console.log("Mapping for student:", r.student.id, { enrollment_id, practice_group_id });

        return {
          id: r.id || undefined,
          type,
          attendance_date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
          note: r.note || null,
          status: r.status,
          enrollment_id: enrollment_id,
          practice_group_id: type === "practice" ? practice_group_id : null,
        };
      });

      console.log("Final data sent to API:", JSON.stringify(data, null, 2));
      await onSubmit(data);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!open || records.length === 0) return null;

  const hasExisting = records.some((r) => r.id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Điểm danh ({records.length} sinh viên)</DialogTitle>
          {hasExisting && (
            <p className="text-sm text-blue-600 mt-1">
              ⚠️ Một số sinh viên đã được điểm danh hôm nay. Lưu lại sẽ ghi đè dữ liệu cũ.
            </p>
          )}
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            onClick={() =>
              setRecords((prev) => prev.map((r) => ({ ...r, status: "present" })))
            }
          >
            Có mặt
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setRecords((prev) => prev.map((r) => ({ ...r, status: "absent" })))
            }
          >
            Vắng
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setRecords((prev) => prev.map((r) => ({ ...r, status: "excused" })))
            }
          >
            Vắng (Có phép)
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setRecords((prev) => prev.map((r) => ({ ...r, status: "late" })))
            }
          >
            Trễ
          </Button>
        </div>

        {loadingAttendance ? (
          <p className="text-center text-muted-foreground">Đang tải dữ liệu điểm danh...</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {records.map((r, i) => (
              <div
                key={r.student.id}
                className="flex items-start justify-between gap-3 border rounded-md p-2"
              >
                <div className="flex-1">
                  <p className="font-medium">{r.student.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    MSSV: {r.student.studentCode}
                  </p>

                  {r.id && (
                    <p className="text-xs text-green-600 mt-1">
                      ✅ Sinh viên này đã được điểm danh hôm nay (sẽ ghi đè nếu lưu lại)
                    </p>
                  )}

                  <div className="flex gap-2 mt-2 flex-wrap">
                    {["present", "absent", "excused", "late"].map((st) => (
                      <Button
                        key={st}
                        size="sm"
                        variant={r.status === st ? "default" : "outline"}
                        onClick={() => handleChange(i, "status", st)}
                      >
                        {st === "present"
                          ? "Có mặt"
                          : st === "absent"
                          ? "Vắng"
                          : st === "excused"
                          ? "Vắng (Có phép)"
                          : "Trễ"}
                      </Button>
                    ))}
                  </div>

                  <Textarea
                    value={r.note}
                    onChange={(e) => handleChange(i, "note", e.target.value)}
                    placeholder="Ghi chú (nếu có)"
                    className="mt-2"
                  />
                </div>

                <Button variant="ghost" size="icon" onClick={() => handleDelete(i)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu điểm danh"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
