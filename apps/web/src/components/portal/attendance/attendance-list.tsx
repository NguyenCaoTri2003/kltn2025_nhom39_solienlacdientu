"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar, BookOpen, AlertCircle } from "lucide-react";
import Loading from "@/components/ui/loading";
import { useUser } from "@/context/user-context";
import { fetchAttendanceByOffering, AttendanceRecord } from "@/services/attendanceService";
import { fetchOfferingsBySemesterWithStudent, Offering } from "@/services/offeringService";
import { fetchSemestersByStudentYear, getCurrentSemester, Semester } from "@/services/semesterService";
import EmptyState from "@/components/empty-state";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";

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

  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [semester, setSemester] = useState<Semester | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const studentId = useMemo(
    () => (isParent ? activeChild?.id : userData?.student?.id),
    [isParent, activeChild?.id, userData?.student?.id]
  );

  const studentYear = useMemo(
    () =>
      isParent
        ? activeChild?.academic_year
        : userData?.student?.academic_year,
    [isParent, activeChild?.academic_year, userData?.student?.academic_year]
  );

  const studentStartYear = useMemo(() => {
    if (!studentYear) return undefined;
    const match = studentYear.match(/(\d{4})/);
    return match ? Number(match[1]) : undefined;
  }, [studentYear]);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    fetchSemestersByStudentYear(studentStartYear)
      .then((data) => {
        setSemesters(data);
        const current = getCurrentSemester(data);
        if (current) {
          setSemester(current);
        } else if (data.length > 0) {
          setSemester(data[data.length - 1]);
        }
      })
      .catch((err: Error) => {
        console.error("Error fetching semesters:", err);
        toast.error("Không thể tải danh sách học kỳ");
      })
      .finally(() => setLoading(false));
  }, [studentId, studentStartYear]);

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

  if (loading && !semester) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loading text="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phần để phụ huynh chọn con*/}
      {isParent && children.length > 1 && (
        <Card>
          {/* <CardHeader>
            <CardTitle className="text-lg">Chọn con</CardTitle>
          </CardHeader> */}
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {children.map((child, index) => (
                <Button
                  key={child.id}
                  variant={selectedChildIndex === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSelectChild(index)}
                >
                  {child.users?.full_name || `Con ${index + 1}`}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* chọn học kỳ*/}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Chọn học kỳ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={semester?.id?.toString()}
            onValueChange={(value: string) => {
              const selected = semesters.find((s) => s.id.toString() === value);
              if (selected) setSemester(selected);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn học kỳ..." />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name} - {s.academic_year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Phần để chọn lớp học phần*/}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loading text="Đang tải danh sách lớp học phần..." />
        </div>
      ) : offerings.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12" />}
          text="Học kỳ này không có lớp học phần nào"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Chọn lớp học phần
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {offerings.map((off) => (
                <Button
                  key={off.id}
                  variant={selectedOffering === off.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => loadAttendance(off.id)}
                  disabled={loadingAttendance}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lịch sử điểm danh</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAttendance ? (
              <div className="flex justify-center items-center py-10">
                <Loading text="Đang tải lịch sử điểm danh..." />
              </div>
            ) : attendance.length === 0 ? (
              <EmptyState
                icon={<AlertCircle className="w-12 h-12" />}
                text="Lớp học phần này chưa có bản ghi điểm danh nào"
              />
            ) : (
              <div className="space-y-3">
                {[...attendance]
                  .sort(
                    (a, b) =>
                      new Date(b.attendance_date).getTime() -
                      new Date(a.attendance_date).getTime()
                  )
                  .map((att) => (
                    <div
                      key={att.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {formatDate(att.attendance_date)}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={statusMap[att.status]?.className}
                        >
                          {statusMap[att.status]?.label || att.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">
                          {typeMap[att.type] || att.type}:
                        </span>
                        <span>{statusMap[att.status]?.label || att.status}</span>
                      </div>
                      {att.note && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <span className="font-medium">Ghi chú: </span>
                          <span>{att.note}</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

