"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTimeVN, formatTimeVN } from "@/utils/format-time";
import { normalize } from "@/utils/normalize";
import EmptyState from "@/components/empty-state";
import { useRouter } from "next/navigation";
import { Appointment } from "@packages/core/entities/Appointment";
import { toast } from "sonner";
import { AppointmentEditModal } from "./appointment-edit-modal";
import { motion } from "framer-motion";
import { LabelRequired } from "@/components/ui/label-requied";

type AppointmentWithParents = Appointment & {
  parents: { id: number; name: string }[];
};

export default function AppointmentList() {
  const [appointments, setAppointments] = useState<AppointmentWithParents[]>([]);
  const [filtered, setFiltered] = useState<AppointmentWithParents[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [messageReceivers, setMessageReceivers] = useState<
    { id: number; name: string }[]
  >([]);
  const [messageSending, setMessageSending] = useState(false);

  useEffect(() => {
    const fetchAppointments = async () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/appointments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();

        const merged = mergeAppointments(data).sort(
          (a: AppointmentWithParents, b: AppointmentWithParents) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setAppointments(merged);
        setFiltered(merged);
      } catch (err) {
        console.error("Lỗi tải danh sách lịch hẹn:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const mergeAppointments = (data: Appointment[]) => {
    const map = new Map<string, AppointmentWithParents>();

    data.forEach((a) => {
      const key = `${a.title}-${a.content}-${a.start_time}-${a.end_time}-${a.student?.users?.full_name}`;
      const parentId = (a as any)?.parent?.id as number | undefined;
      const parentName = (a as any)?.parent?.users?.full_name ?? "Không rõ";

      if (!map.has(key)) {
        map.set(key, {
          ...(a as any),
          parents: parentId ? [{ id: parentId, name: parentName }] : [],
        });
      } else {
        const exist = map.get(key)!;
        if (parentId && !exist.parents.some((p) => p.id === parentId)) {
          exist.parents.push({ id: parentId, name: parentName });
        }
      }
    });

    return Array.from(map.values());
  };

  const handleSearch = async () => {
    setHasSearched(true);
    setIsSearching(true);
    await new Promise((res) => setTimeout(res, 300));

    const lower = normalize(search);

    const result = appointments.filter((a) => {
      const dateStr = new Date(a.start_time).toISOString().slice(0, 10);
      const matchKeyword =
        normalize(a.title).includes(lower) ||
        normalize(a.content).includes(lower) ||
        normalize(a.student?.users?.full_name ?? "").includes(lower) ||
        a.parents.some((p) => normalize(p.name).includes(lower));

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

  const handleOpenMessageModal = (appointment: AppointmentWithParents) => {
    const receivers = appointment.parents?.length
      ? appointment.parents
      : (appointment as any)?.parent?.id
        ? [
          {
            id: (appointment as any).parent.id as number,
            name:
              (appointment as any).parent?.users?.full_name ?? "Phụ huynh",
          },
        ]
        : [];

    if (receivers.length === 0) {
      toast.error("Không tìm thấy phụ huynh để nhắn tin.");
      return;
    }

    setMessageReceivers(receivers);
    setMessageContent("");
    setMessageModalOpen(true);
  };

  const handleSendMessage = async () => {
    try {
      if (!messageContent.trim()) return;
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Bạn chưa đăng nhập.");
        return;
      }

      setMessageSending(true);
      await Promise.all(
        messageReceivers.map(async (r) => {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ receiverId: r.id, content: messageContent }),
          });
        })
      );

      toast.success("Gửi tin nhắn thành công!");
      setMessageModalOpen(false);
      setMessageContent("");
      router.push("/lecturer/communications");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi gửi tin nhắn");
    } finally {
      setMessageSending(false);
    }
  };

  const handleSave = async (updated: Appointment) => {
    try {
      const token = localStorage.getItem("token");

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

      if (!res.ok) throw new Error("Cập nhật thất bại");

      toast.success("Đã lưu thay đổi");

      // Cập nhật lại state
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === updated.id ? { ...a, ...payload, parents: a.parents } : a
        )
      );
      setFiltered((prev) =>
        prev.map((a) =>
          a.id === updated.id ? { ...a, ...payload, parents: a.parents } : a
        )
      );
      setSelected(null);
    } catch (e: any) {
      toast.error(e.message || "Lỗi cập nhật");
    }
  };

  const handleAccept = async (appointment: AppointmentWithParents) => {
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

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointment.id ? { ...a, status: "confirmed" } : a
        )
      );
      setFiltered((prev) =>
        prev.map((a) =>
          a.id === appointment.id ? { ...a, status: "confirmed" } : a
        )
      );
      setSelected(null);
    } catch (e: any) {
      toast.error(e.message || "Lỗi chấp nhận");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (appointment: AppointmentWithParents) => {
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

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointment.id ? { ...a, status: "cancelled" } : a
        )
      );
      setFiltered((prev) =>
        prev.map((a) =>
          a.id === appointment.id ? { ...a, status: "cancelled" } : a
        )
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
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
        <div className="rounded-3xl border border-border/60 bg-card/40 p-10 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Đang tải danh sách lịch hẹn...</p>
        </div>
      </div>
    );

  if (appointments.length === 0)
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
        <div className="rounded-3xl border border-border/60 bg-card/40 p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <EmptyState
            icon={<Calendar className="w-10 h-10" />}
            text="Không có lịch hẹn nào"
            className="py-4"
          />
          <div className="mt-6 flex justify-center">
            <Button onClick={() => router.push("/lecturer/classes")} className="rounded-full">
              Đến lớp học
            </Button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
      <div className="space-y-6 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] sm:w-72">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tiêu đề, phụ huynh, sinh viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-10 h-11 rounded-full border border-border/50 bg-background/80 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.6)] backdrop-blur focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/40"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-11 w-full sm:w-40 rounded-full border border-border/50 bg-background/80 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.6)] backdrop-blur focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/40"
          />

          <Button onClick={handleSearch} disabled={isSearching} className="rounded-full">
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
            <Button variant="destructive" onClick={handleReset} className="rounded-full">
              <X className="w-4 h-4 mr-2" /> Đặt lại
            </Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-card/40 p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <EmptyState
              icon={<Calendar className="w-10 h-10" />}
              text="Không có cuộc hẹn cần tìm"
              className="py-4"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((a) => (
              <motion.div
                key={a.id}
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Card
                  onClick={() => {
                      if (a.from === "lecturer" && a.status === "pending") {
                        setSelected(a);
                      }
                    }}
                  className={cn(
                      "group rounded-3xl border border-border/60 bg-linear-to-br from-card/95 via-card/90 to-background/60 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)] ring-1 ring-transparent transition-all duration-300",
                      a.from === "lecturer" && a.status === "pending"
                        ? "cursor-pointer hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_28px_90px_-50px_rgba(59,130,246,0.75)] hover:ring-primary/40"
                        : "opacity-80",
                      a.status === "pending"
                        ? "border-l-4 border-l-yellow-500"
                        : a.status === "confirmed"
                          ? "border-l-4 border-l-green-500"
                          : a.status === "cancelled"
                            ? "border-l-4 border-l-red-500"
                            : "border-l-4 border-l-gray-400"
                    )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                        {a.title}
                      </CardTitle>
                      <div className="shrink-0 flex items-center gap-2">
                        <Button
                          variant="outline"
                          className="rounded-full px-3 py-1 text-xs font-medium h-auto"
                          disabled={!a.parents || a.parents.length === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenMessageModal(a);
                          }}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Gửi tin nhắn
                        </Button>

                        <div
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium",
                            a.status === "pending"
                              ? "bg-yellow-500/15 text-yellow-700"
                              : a.status === "confirmed"
                                ? "bg-green-500/15 text-green-700"
                                : a.status === "cancelled"
                                  ? "bg-red-500/15 text-red-700"
                                  : "bg-gray-500/15 text-gray-700"
                          )}
                        >
                          {a.status === "pending"
                            ? "Chờ xác nhận"
                            : a.status === "confirmed"
                              ? "Đã xác nhận"
                              : a.status === "cancelled"
                                ? "Đã hủy"
                                : "Hoàn tất"}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">
                          <span className="font-medium text-foreground">Phụ huynh:</span>{" "}
                          <span className="text-muted-foreground">
                            {a.parents.map((p) => p.name).join(", ")}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">
                          <span className="font-medium text-foreground">Sinh viên:</span>{" "}
                          <span className="text-muted-foreground">
                            {a.student?.users?.full_name ?? "Không rõ"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">
                          <span className="font-medium text-foreground">Thời gian:</span>{" "}
                          <span className="text-muted-foreground">
                            {formatTimeVN(a.start_time)} - {formatDateTimeVN(a.end_time)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {a.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate">
                            <span className="font-medium text-foreground">Địa điểm:</span>{" "}
                            <span className="text-muted-foreground">{a.location}</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {a.content && (
                      <div className="mt-3 rounded-2xl border border-dashed border-border/50 bg-muted/20 p-3">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                            {a.content}
                          </p>
                        </div>
                      </div>
                    )}

                    {a.status === "pending" && a.from !== "lecturer" && (
                      <div className="flex gap-2 pt-2 border-t border-border/40">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-full border-green-600/50 text-green-600 hover:bg-green-50 hover:border-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(a);
                          }}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Chấp nhận
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 rounded-full border-red-600/50 text-red-600 hover:bg-red-50 hover:border-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(a);
                          }}
                          disabled={actionLoading}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> Từ chối
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {selected && (
          <AppointmentEditModal
            appointment={selected}
            onClose={() => setSelected(null)}
            onSave={handleSave}
          />
        )}

        <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
          <DialogContent className="max-w-lg flex flex-col gap-4">
            <DialogHeader className="border-b pb-2">
              <DialogTitle>Nhắn tin phụ huynh</DialogTitle>
              <DialogDescription>
                Tin nhắn sẽ được gửi đến:{" "}
                {messageReceivers.map((r) => r.name).join(", ")}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <LabelRequired required>Nội dung tin nhắn</LabelRequired>
                <Textarea
                  className="mt-2"
                  placeholder="Nhập nội dung tin nhắn..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={6}
                />
              </div>
            </div>

            <DialogFooter className="border-t pt-2">
              <Button
                variant="outline"
                onClick={() => setMessageModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                disabled={!messageContent.trim() || messageSending}
                onClick={handleSendMessage}
              >
                {messageSending ? "Đang gửi..." : "Gửi tin nhắn"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
