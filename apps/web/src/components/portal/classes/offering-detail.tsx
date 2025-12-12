"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchOfferingDetailWithStudent } from "@/services/offeringService";
import { getStatusLabel } from "@/utils/get-status-label";
import { useUser } from "@/context/user-context";
import {
  Calendar,
  Info,
  School,
  FlaskConical,
  Users,
  AlertTriangle,
  MessageCircle,
  BookOpen,
  BookText,
} from "lucide-react";
import EmptyState from "@/components/empty-state";
import Loading from "@/components/ui/loading";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { conversationService } from "@/services/conversationService";
import { AppointmentModalBase } from "@/components/portal/appointment/appointment-modal";
import { useAppointment } from "@/hooks/useAppointment";

export default function OfferingDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { userData } = useUser();
  const [data, setData] = useState<{
    name: string;
    class_code: string;
    semester: { name: string; academic_year: string; start_date: string; end_date: string };
    status: string;
    course: { credit: number; tuition_fee?: number };
    registered: number;
    capacity: number;
    description?: string;
    lecturer: { id: number; full_name: string; email: string };
    schedule?: Array<{ id: number; day_of_week: number; building: string; classroom?: string; start_period: number; period_count: number }>;
    practice_group?: {
      lecturer: { id: number; full_name: string; email: string };
      group_number: number;
      registered: number;
      capacity: number;
      schedule?: Array<{ id: number; day_of_week: number; building: string; classroom?: string; start_period: number; period_count: number }>;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const token = localStorage.getItem("token");
  const { createAppointment } = useAppointment(token || undefined);

  const studentId =
    userData?.role === "student"
      ? userData.student?.id
      : userData?.children?.[0]?.id;

  useEffect(() => {
    if (!id || !studentId) return;
    (async () => {
      try {
        const detail = await fetchOfferingDetailWithStudent(Number(id), studentId);
        setData(detail);
      } catch (e) {
        console.error(e);
        toast.error("Không thể tải chi tiết lớp học phần");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, studentId]);

  if (loading) return (
    <Loading text="Đang tải chi tiết lớp học phần..." />
  );
  if (!data)
    return (
      <EmptyState
        icon={<BookText className="w-10 h-10" />}
        text="Không có lớp học phần nào được tìm thấy."
        className="py-1"
      />
    );

  const { label, color } = getStatusLabel(data.status);
  const semesterEnded = new Date(data.semester.end_date) < new Date();
  const dayNames = [
    "Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7",
  ];

  const handleChat = async (lecturerId: number) => {
    if (!token) {
      toast.error("Bạn cần đăng nhập để nhắn tin.");
      return;
    }

    try {
      toast.info("Đang mở trò chuyện...");

      const conversation = await conversationService.getOrCreateConversation(
        token,
        lecturerId
      );

      router.push(`/portal/communications/${conversation.id}`);
    } catch (err) {
      console.error("Chat error:", err);
      toast.error("Không thể mở cuộc trò chuyện.");
    }
  };

  const handleCreateAppointment = async (formData: {
    title: string;
    date: string;
    start: string;
    end: string;
    location?: string;
    content?: string;
    studentId?: number;
    lecturerId?: number;
  }) => {
    if (!studentId) {
      toast.error("Không tìm thấy thông tin sinh viên!");
      return;
    }

    const toUTCString = (date: string, time: string) =>
      new Date(`${date}T${time}:00+07:00`).toISOString();

    const start_time = toUTCString(formData.date, formData.start);
    const end_time = toUTCString(formData.date, formData.end);

    try {
      await createAppointment({
        studentId,
        lecturerId: data.lecturer.id,
        title: formData.title,
        content: formData.content || "",
        start_time: start_time,
        end_time: end_time,
        location: formData.location || "",
      });

      toast.success("Đã gửi yêu cầu lịch hẹn thành công!");
      setModalVisible(false);
    } catch (err) {
      console.error(err);
      toast.error("Không thể gửi yêu cầu lịch hẹn.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <PageBreadcrumb
        items={[
          { label: "Lớp học phần", href: "/portal/classes" },
          { label: data.name }
        ]}
      />
      <div className="flex-1 mx-auto w-full max-w-7xl p-6 space-y-8 animate-fadeIn">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
          <div className="space-y-10 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-start gap-4 border-b border-border/40 pb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner shadow-primary/20">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-semibold text-foreground md:text-4xl">{data.name}</h1>
                <p className="mt-2 text-muted-foreground text-sm">
                  {data.class_code} · {data.semester.name} ({data.semester.academic_year})
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">Trạng thái:</span>
                  <span className="text-sm font-medium" style={{ color }}>{label}</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            {semesterEnded && (
              <div className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive font-medium">Học kỳ đã kết thúc. Thông tin chỉ mang tính tham khảo.</p>
              </div>
            )}

            {/* Thông tin lớp */}
            <Card className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/70 p-6 sm:p-8 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
              <CardHeader className="gap-3 pb-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Info className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Thông tin lớp học phần
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/40 bg-muted/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Số tín chỉ
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {data.course.credit}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-muted/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Học phí
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {data.course.tuition_fee
                        ? `${data.course.tuition_fee.toLocaleString("vi-VN")}₫`
                        : "Chưa cập nhật"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-muted/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Sĩ số
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {data.registered}/{data.capacity}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-muted/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Thời gian học
                    </p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {new Date(data.semester.start_date).toLocaleDateString("vi-VN")} -{" "}
                      {new Date(data.semester.end_date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>

                {data.description && (
                  <div className="mt-6 rounded-2xl border border-border/40 bg-background/60 px-4 py-3">
                    <p className="text-sm text-muted-foreground italic">
                      &ldquo;{data.description}&rdquo;
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Giảng viên lý thuyết */}
            <Card className="rounded-3xl border border-border/60 bg-gradient-to-br from-blue-50/30 via-card/90 to-background/70 p-6 sm:p-8 shadow-[0_24px_80px_-50px_rgba(37,99,235,0.35)] backdrop-blur">
              <CardHeader className="gap-3 pb-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-600">
                    <School className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Giảng viên lý thuyết
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-6 space-y-4">
                <div>
                  <p className="text-base font-semibold text-foreground">{data.lecturer.full_name}</p>
                  <p className="text-sm text-muted-foreground">{data.lecturer.email}</p>
                </div>

                {!semesterEnded && (
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={() => handleChat(data.lecturer.id)}
                      className="rounded-full shadow-[0_4px_14px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)]"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" /> Nhắn tin
                    </Button>

                    {userData?.role === "parent" && (
                      <Button 
                        variant="outline" 
                        onClick={() => setModalVisible(true)}
                        className="rounded-full border-primary/40 hover:bg-primary/10"
                      >
                        <Calendar className="w-4 h-4 mr-2" /> Đặt lịch hẹn
                      </Button>
                    )}
                  </div>
                )}

                <div className="mt-6 rounded-2xl border border-border/40 bg-background/60 px-4 py-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Lịch học lý thuyết
                  </h3>
                  {data.schedule && data.schedule.length > 0 ? (
                    <ul className="space-y-2">
                      {data.schedule.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <span className="text-muted-foreground">{dayNames[s.day_of_week]}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{s.building}{s.classroom ? `.${s.classroom}` : ""}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-medium">Tiết {s.start_period}–{s.start_period + s.period_count - 1}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Không có lịch học.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Giảng viên thực hành */}
            {data.practice_group && (
              <Card className="rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-50/30 via-card/90 to-background/70 p-6 sm:p-8 shadow-[0_24px_80px_-50px_rgba(16,185,129,0.35)] backdrop-blur">
                <CardHeader className="gap-3 pb-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
                      <FlaskConical className="h-5 w-5" />
                    </span>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Giảng viên thực hành
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-6 space-y-4">
                  <div>
                    <p className="text-base font-semibold text-foreground">{data.practice_group.lecturer.full_name}</p>
                    <p className="text-sm text-muted-foreground">{data.practice_group.lecturer.email}</p>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-muted/10 px-4 py-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Nhóm:</span>
                    <span className="font-semibold text-foreground">{data.practice_group.group_number}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-muted-foreground">Sĩ số:</span>
                    <span className="font-semibold text-foreground">
                      {data.practice_group.registered}/{data.practice_group.capacity}
                    </span>
                  </div>

                  {!semesterEnded && (
                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)]"
                        onClick={() => data.practice_group && handleChat(data.practice_group.lecturer.id)}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" /> Nhắn tin
                      </Button>

                      {userData?.role === "parent" && (
                        <Button
                          variant="outline"
                          className="rounded-full border-emerald-500/40 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => setModalVisible(true)}
                        >
                          <Calendar className="w-4 h-4 mr-2" /> Đặt lịch hẹn
                        </Button>
                      )}
                    </div>
                  )}

                  <div className="mt-6 rounded-2xl border border-border/40 bg-background/60 px-4 py-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Lịch học thực hành
                    </h3>
                    {data.practice_group?.schedule && data.practice_group.schedule.length > 0 ? (
                      <ul className="space-y-2">
                        {data.practice_group.schedule.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center gap-2 text-sm text-foreground"
                          >
                            <span className="text-muted-foreground">{dayNames[s.day_of_week]}</span>
                            <span className="text-muted-foreground">·</span>
                            <span>{s.building}{s.classroom ? `.${s.classroom}` : ""}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="font-medium">Tiết {s.start_period}–{s.start_period + s.period_count - 1}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Không có lịch học.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AppointmentModalBase
        open={modalVisible}
        onOpenChange={setModalVisible}
        onSubmit={handleCreateAppointment}
        title="Đặt lịch hẹn với giảng viên"
      />
    </div>
  );
}
