"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  MapPin,
  User,
  MessageSquare,
  Search,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTimeVN, formatTimeVN } from "@/utils/format-time";
import { normalize } from "@/utils/normalize";
import EmptyState from "@/components/empty-state";
import { Appointment } from "@packages/core/entities/Appointment";
import { toast } from "sonner";
import { AppointmentEditModal } from "@/components/lecturer/appointment/appointment-edit-modal";

interface AppointmentWithLecturer extends Appointment {
  lecturer?: { id: number; users?: { full_name: string } };
  from?: string;
}

export default function ParentAppointmentList() {
  const [appointments, setAppointments] = useState<AppointmentWithLecturer[]>([]);
  const [filtered, setFiltered] = useState<AppointmentWithLecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected] = useState<AppointmentWithLecturer | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast.error("Bạn chưa đăng nhập");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/appointments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Không thể tải danh sách lịch hẹn");
        }

        const data = await res.json();

        const sorted = data.sort(
          (a: AppointmentWithLecturer, b: AppointmentWithLecturer) =>
            new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        );

        setAppointments(sorted);
        setFiltered(sorted);
      } catch (err: any) {
        console.error("Lỗi tải danh sách lịch hẹn:", err);
        toast.error(err.message || "Lỗi tải danh sách lịch hẹn");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleSearch = async () => {
    setHasSearched(true);
    setIsSearching(true);
    await new Promise((res) => setTimeout(res, 300));

    const lower = normalize(search);

    const result = appointments.filter((a) => {
      const dateStr = new Date(a.start_time).toISOString().slice(0, 10);
      const matchKeyword =
        normalize(a.title).includes(lower) ||
        normalize(a.content || "").includes(lower) ||
        normalize(a.lecturer?.users?.full_name ?? "").includes(lower) ||
        normalize(a.student?.users?.full_name ?? "").includes(lower);

      const matchDate = filterDate ? dateStr === filterDate : true;
      return matchKeyword && matchDate;
    });

    setFiltered(result);
    setIsSearching(false);
  };

  const handleReset = () => {
    setSearch("");
    setFilterDate("");
    setFiltered(appointments);
    setHasSearched(false);
  };

  const handleSave = async (updated: Appointment) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Bạn chưa đăng nhập");
        return;
      }

      const payload = {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        start_time: updated.start_time,
        end_time: updated.end_time,
        location: updated.location,
        status: updated.status,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Cập nhật thất bại");
      }

      toast.success("Đã lưu thay đổi");

      // Cập nhật lại state
      setAppointments((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...a, ...payload } : a))
      );
      setFiltered((prev) =>
        prev.map((a) => (a.id === updated.id ? { ...a, ...payload } : a))
      );
      setSelected(null);
    } catch (e: any) {
      toast.error(e.message || "Lỗi cập nhật");
    }
  };

  const handleAccept = async (appointment: AppointmentWithLecturer) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Bạn chưa đăng nhập");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: appointment.id, status: "confirmed" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Chấp nhận thất bại");
      }

      toast.success("Đã chấp nhận lịch hẹn");

      // Cập nhật lại state
      const updated = { ...appointment, status: "confirmed" };
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointment.id ? updated : a))
      );
      setFiltered((prev) =>
        prev.map((a) => (a.id === appointment.id ? updated : a))
      );
      setSelected(null);
    } catch (e: any) {
      toast.error(e.message || "Lỗi chấp nhận");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (appointment: AppointmentWithLecturer) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Bạn chưa đăng nhập");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: appointment.id, status: "cancelled" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Từ chối thất bại");
      }

      toast.success("Đã từ chối lịch hẹn");

      // Cập nhật lại state
      const updated = { ...appointment, status: "cancelled" };
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointment.id ? updated : a))
      );
      setFiltered((prev) =>
        prev.map((a) => (a.id === appointment.id ? updated : a))
      );
      setSelected(null);
    } catch (e: any) {
      toast.error(e.message || "Lỗi từ chối");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Đang tải danh sách lịch hẹn...
      </div>
    );

  if (appointments.length === 0)
    return (
      <div className="flex flex-col items-center text-muted-foreground gap-2 text-center mt-2">
        <EmptyState
          icon={<Calendar className="w-10 h-10" />}
          text="Không có lịch hẹn nào"
          className="py-1"
        />
      </div>
    );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b bg-background">
        <div className="relative w-72">
          <Input
            placeholder="Tìm theo tiêu đề, giảng viên, học sinh..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-8"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-40"
        />

        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang tìm...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" /> Tìm kiếm
            </>
          )}
        </Button>

        {hasSearched && (
          <Button variant="destructive" onClick={handleReset}>
            <X className="w-4 h-4 mr-2" /> Đặt lại
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-10 h-10" />}
          text="Không có cuộc hẹn cần tìm"
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filtered.map((a) => {
            const isFromLecturer = a.from === "lecturer";
            const canAcceptReject = isFromLecturer && a.status === "pending";

            return (
              <Card
                key={a.id}
                onClick={() => setSelected(a)}
                className={cn(
                  "border-l-4 transition-all cursor-pointer",
                  a.status === "pending"
                    ? "border-l-yellow-500"
                    : a.status === "confirmed"
                      ? "border-l-green-500"
                      : a.status === "cancelled"
                        ? "border-l-red-500"
                        : "border-l-gray-400"
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    {a.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>
                      Giảng viên:{" "}
                      <strong>{a.lecturer?.users?.full_name ?? "Không rõ"}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span>
                      Học sinh:{" "}
                      <strong>{a.student?.users?.full_name ?? "Không rõ"}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>
                      {formatTimeVN(a.start_time)} -{" "}
                      {formatDateTimeVN(a.end_time)}
                    </span>
                  </div>

                  {a.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{a.location}</span>
                    </div>
                  )}

                  {a.content && (
                    <div className="flex items-start gap-2 mt-2 bg-muted/30 p-2 rounded-md">
                      <MessageSquare className="w-4 h-4 text-primary mt-[2px]" />
                      <p className="text-muted-foreground leading-snug">
                        {a.content}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        a.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : a.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : a.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {a.status === "pending"
                        ? "Chờ xác nhận"
                        : a.status === "confirmed"
                          ? "Đã xác nhận"
                          : a.status === "cancelled"
                            ? "Đã hủy"
                            : "Hoàn tất"}
                    </span>

                    {canAcceptReject && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(a);
                          }}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Chấp nhận
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(a);
                          }}
                          disabled={actionLoading}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Từ chối
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <AppointmentEditModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

