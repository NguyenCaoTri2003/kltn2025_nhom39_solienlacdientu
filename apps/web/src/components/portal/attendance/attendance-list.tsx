"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, BookOpen, AlertCircle, CalendarDays, GraduationCap } from "lucide-react";
import { useUser } from "@/context/user-context";
import { fetchAttendanceByOffering, AttendanceRecord } from "@/services/attendanceService";
import { fetchOfferingsBySemesterWithStudent, Offering } from "@/services/offeringService";
import { Semester } from "@/services/semesterService";
import EmptyState from "@/components/empty-state";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import SemesterSelector from "@/components/lecturer/classes/semester-selector";

const statusMap: Record<string, { label: string; className: string }> = {
  present: { label: "Có mặt", className: "bg-green-100 text-green-700 border-green-200" },
  absent: { label: "Vắng", className: "bg-red-100 text-red-700 border-red-200" },
  late: { label: "Đi muộn", className: "bg-orange-100 text-orange-700 border-orange-200" },
  excused: { label: "Có phép", className: "bg-blue-100 text-blue-700 border-blue-200" },
};

const typeMap: Record<string, string> = {
  theory: "Lý thuyết",
  practice: "Thực hành",
};

export default function AttendanceList() {
  const { userData } = useUser();
  const isParent = userData?.role === "parent";
  const children = userData?.children || [];
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const activeChild = isParent ? children[selectedChildIndex] : null;

  const [semester, setSemester] = useState<Semester | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const studentId = useMemo(
    () => (isParent ? activeChild?.id : userData?.student?.id),
    [isParent, activeChild?.id, userData?.student?.id]
  );


  useEffect(() => {
    if (!semester || !studentId) return;
    setLoading(true);
    fetchOfferingsBySemesterWithStudent(semester.id, studentId)
      .then((data) => {
        setOfferings(data);
        setSelectedOffering(null);
        setAttendance([]);
      })
      .catch((err: Error) => {
        console.error("Error fetching offerings:", err);
        toast.error("Không thể tải danh sách lớp học phần");
      })
      .finally(() => setLoading(false));
  }, [semester, studentId]);

  const loadAttendance = async (offeringId: number) => {
    setSelectedOffering(offeringId);
    setLoadingAttendance(true);
    try {
      const data = await fetchAttendanceByOffering(studentId!, offeringId);
      setAttendance(data);
    } catch (err: Error | unknown) {
      console.error("Error fetching attendance:", err);
      const message = err instanceof Error ? err.message : "Không thể tải dữ liệu điểm danh";
      toast.error(message);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleSelectChild = (index: number) => {
    setSelectedChildIndex(index);
    setSemester(null);
    setOfferings([]);
    setSelectedOffering(null);
    setAttendance([]);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: vi });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
      <div className="space-y-10 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        {/* Header với tabs và chọn học kỳ trên cùng một hàng */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          {/* Phần để phụ huynh chọn con*/}
          {isParent && children.length > 1 && (
            <div className="flex gap-2 flex-wrap rounded-2xl border border-border/40 bg-muted/30 p-3">
              {children.map((child, index) => (
                <button
                  key={child.id}
                  className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                    selectedChildIndex === index
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-background/60 text-foreground hover:bg-muted"
                  }`}
                  onClick={() => handleSelectChild(index)}
                >
                  {child.users?.full_name || `Con ${index + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Chọn học kỳ */}
          <div className="flex items-center gap-3 ml-auto">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary shrink-0">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-foreground whitespace-nowrap">
                Chọn học kỳ
              </span>
              <SemesterSelector
                onChange={(selected) => {
                  if (selected) {
                    // Convert Semester type - handle undefined to null conversion
                    const localSemester = {
                      ...selected,
                      start_date: selected.start_date ?? null,
                      end_date: selected.end_date ?? null,
                    } as Semester;
                    setSemester(localSemester);
                  } else {
                    setSemester(null);
                  }
                }}
                className="min-w-[280px] rounded-full border border-border/50 bg-gradient-to-r from-background/90 via-background/80 to-background/70 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.6)] backdrop-blur"
              />
            </div>
          </div>
        </div>

        {/* Phần để chọn lớp học phần*/}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">Đang tải danh sách lớp học phần...</p>
            </div>
          </div>
        ) : offerings.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-10 h-10" />}
            text="Học kỳ này không có lớp học phần nào"
          />
        ) : (
          <Card className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/70 p-6 sm:p-8 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
            <CardHeader className="gap-3 pb-0">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Chọn lớp học phần
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-6">
              <div className="flex gap-3 flex-wrap">
                {offerings.map((off) => (
                  <Button
                    key={off.id}
                    variant={selectedOffering === off.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => loadAttendance(off.id)}
                    disabled={loadingAttendance}
                    className={`rounded-full transition-all ${
                      selectedOffering === off.id
                        ? "shadow-[0_4px_14px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)]"
                        : "border-border/50 bg-background/60 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.6)] backdrop-blur"
                    }`}
                  >
                    {off.name}
                    {loadingAttendance && selectedOffering === off.id && (
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* hiển thị lịch sử điểm danh*/}
        {selectedOffering && (
          <Card className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/70 p-6 sm:p-8 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
            <CardHeader className="gap-3 pb-0">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Lịch sử điểm danh
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mt-6">
              {loadingAttendance ? (
                <div className="flex justify-center items-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Loader2 className="h-7 w-7 animate-spin" />
                    </div>
                    <p className="text-sm text-muted-foreground">Đang tải lịch sử điểm danh...</p>
                  </div>
                </div>
              ) : attendance.length === 0 ? (
                <EmptyState
                  icon={<AlertCircle className="w-10 h-10" />}
                  text="Lớp học phần này chưa có bản ghi điểm danh nào"
                />
              ) : (
                <div className="space-y-4">
                  {[...attendance]
                    .sort(
                      (a, b) =>
                        new Date(b.attendance_date).getTime() -
                        new Date(a.attendance_date).getTime()
                    )
                    .map((att) => {
                      const statusInfo = statusMap[att.status] || { label: att.status, className: "" };
                      const isPresent = att.status === "present";
                      const isAbsent = att.status === "absent";
                      const isLate = att.status === "late";
                      
                      return (
                        <div
                          key={att.id}
                          className={`rounded-2xl border p-4 transition-all hover:shadow-md ${
                            isPresent
                              ? "border-emerald-500/40 bg-gradient-to-br from-emerald-50/50 via-emerald-50/30 to-background/60"
                              : isAbsent
                              ? "border-amber-500/40 bg-gradient-to-br from-amber-50/50 via-amber-50/30 to-background/60"
                              : isLate
                              ? "border-orange-500/40 bg-gradient-to-br from-orange-50/50 via-orange-50/30 to-background/60"
                              : "border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-background/60"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/60">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <span className="font-semibold text-foreground">
                                {formatDate(att.attendance_date)}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`font-semibold ${
                                isPresent
                                  ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700"
                                  : isAbsent
                                  ? "border-amber-500/60 bg-amber-500/10 text-amber-700"
                                  : isLate
                                  ? "border-orange-500/60 bg-orange-500/10 text-orange-700"
                                  : "border-primary/60 bg-primary/10 text-primary"
                              }`}
                            >
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm mb-2">
                            <span className="font-medium text-muted-foreground">
                              {typeMap[att.type] || att.type}:
                            </span>
                            <span className="text-foreground">{statusInfo.label}</span>
                          </div>
                          {att.note && (
                            <div className="mt-3 rounded-xl border border-border/40 bg-background/60 px-3 py-2 text-sm">
                              <span className="font-semibold text-muted-foreground">Ghi chú: </span>
                              <span className="text-foreground">{att.note}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

