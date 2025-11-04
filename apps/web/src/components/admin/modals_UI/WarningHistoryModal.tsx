"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, AlertTriangle } from "lucide-react";
import Loading from "@/components/ui/loading";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { translateWarningLevel } from "@packages/utils/translations";

interface WarningHistoryModalProps {
  open: boolean;
  onClose: () => void;
  studentId?: string | number | null;
  semesterId?: string | number | null;
  apiBase?: string;
  semesters?: Array<{ id: number | string; name?: string }>;
}

type WarningHistoryData = {
  student_id: number;
  student_code: string | null;
  full_name: string | null;
  semester_id: number | null;
  total_warning: number;
  warnings: Array<{
    id: number;
    student_id: number;
    semester_id: number;
    level: string;
    reason: string;
    warned_at: string;
  }>;
};

export function WarningHistoryModal({ open, onClose, studentId, semesterId, apiBase, semesters }: WarningHistoryModalProps) {
  const API_BASE = apiBase || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  const getToken = () => {
    try {
      if (typeof document !== "undefined") {
        const cookieToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];
        const lsToken = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
        return cookieToken || lsToken || null;
      }
    } catch {}
    return null;
  };

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<WarningHistoryData | undefined>(undefined);
  const [semesterName, setSemesterName] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    const fetchData = async () => {
      if (!open || !studentId) return;
      setLoading(true);
      setError(null);
      setData(undefined);
      try {
        const params = new URLSearchParams();
        if (semesterId) params.set("semesterId", String(semesterId));
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/students/${studentId}/warnings${params.toString() ? `?${params.toString()}` : ""}`, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (!alive) return;
        if (json?.returnCode !== 0) throw new Error(json?.message || "Fetch failed");
        setData(json.data as WarningHistoryData);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Lỗi tải lịch sử cảnh cáo";
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchData();
    return () => {
      alive = false;
    };
  }, [open, studentId, semesterId, API_BASE]);


  React.useEffect(() => {
    let alive = true;
    const resolveSemesterName = async () => {
      if (!open) return;
      const sid = semesterId ?? data?.semester_id;
      if (sid == null) {
        setSemesterName(null);
        return;
      }
      try {
        if (Array.isArray(semesters) && semesters.length > 0) {
          const found = semesters.find((s) => Number(s.id) === Number(sid));
          setSemesterName(found?.name ?? `Học kỳ ${sid}`);
          return;
        }
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/semesters`, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (!alive) return;
        if (json?.returnCode === 0 && Array.isArray(json.data)) {
          type Sem = { id: number | string; name?: string };
          const arr: Sem[] = json.data as Sem[];
          const found = arr.find((s) => Number(s.id) === Number(sid));
          setSemesterName(found?.name ?? `Học kỳ ${sid}`);
        } else {
          setSemesterName(`Học kỳ ${sid}`);
        }
      } catch {
        if (alive) setSemesterName(`Học kỳ ${sid}`);
      }
    };
    resolveSemesterName();
    return () => {
      alive = false;
    };
  }, [open, semesterId, data?.semester_id, API_BASE, semesters]);
  const getLevelColor = (level: string) => {
    switch (level) {
      case "minor":
        return "bg-green-100 text-green-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "major":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Lịch sử cảnh cáo học tập
            {data && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                - {data.full_name || data.student_code || `SV ${data.student_id}`}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loading text="Đang tải lịch sử cảnh cáo..." />
            </div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : data ? (
            <>
              <div className="text-sm space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><b>Mã sinh viên:</b> {data.student_code || data.student_id}</p>
                    <p><b>Họ tên:</b> {data.full_name || "Chưa có thông tin"}</p>
                  </div>
                  <div>
                    <p><b>Học kỳ:</b> {semesterName || (data.semester_id ? `Học kỳ ${data.semester_id}` : "Tất cả")}</p>
                    <p><b>Tổng số cảnh cáo:</b> <span className="font-medium text-red-600">{data.total_warning}</span></p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="border rounded-xl shadow-sm bg-white">
                <DataTable
                  headers={[
                    "#",
                    "Mức độ",
                    "Học kỳ", 
                    "Lý do",
                    "Thời gian"
                  ]}
                  maxHeight="400px"
                >
                  {data.warnings.map((w, i) => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 border-b text-center font-medium">{i + 1}</td>
                      <td className="px-4 py-3 border-b">
                        <Badge className={getLevelColor(w.level)}>{translateWarningLevel(w.level)}</Badge>
                      </td>
                      <td className="px-4 py-3 border-b text-sm text-muted-foreground">
                        {w.semester_id ? `HK ${w.semester_id}` : "-"}
                      </td>
                      <td className="px-4 py-3 border-b text-sm">
                        <div className="max-w-[300px] break-words" title={w.reason}>
                          {w.reason}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <CalendarDays className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            {format(new Date(w.warned_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>

              {/* <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={onClose}>
                  Đóng
                </Button>
              </div> */}
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Không có dữ liệu cảnh cáo.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
