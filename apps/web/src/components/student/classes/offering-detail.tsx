"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  Loader2,
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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const token = localStorage.getItem("token");
  const { createAppointment, loading: creating } = useAppointment(token || undefined);

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
      toast.error("Không tìm thấy thông tin học sinh!");
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
      <div className="flex-1 mx-auto w-full space-y-8 animate-fadeIn mt-3">
        {/* Header */}
        <div className="border-b pb-4 flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{data.name}</h1>
            <p className="text-muted-foreground text-sm">
              {data.class_code} · {data.semester.name} ({data.semester.academic_year})
            </p>
            <p className="mt-1 text-sm">
              <span className="font-semibold">Trạng thái: </span>
              <span style={{ color }}>{label}</span>
            </p>
          </div>
        </div>

        {/* Warning */}
        {semesterEnded && (
          <div className="flex items-center bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg shadow-sm">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            <p>Học kỳ đã kết thúc. Thông tin chỉ mang tính tham khảo.</p>
          </div>
        )}

        {/* Thông tin lớp */}
        <div className="bg-card rounded-2xl shadow-md p-6 border border-border/30 hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Thông tin lớp học phần</h2>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:text-base">
            <p><strong>Số tín chỉ:</strong> {data.course.credit}</p>
            <p>
              <strong>Học phí:</strong>{" "}
              {data.course.tuition_fee
                ? `${data.course.tuition_fee.toLocaleString("vi-VN")}₫`
                : "Chưa cập nhật"}
            </p>
            <p><strong>Sĩ số:</strong> {data.registered}/{data.capacity}</p>
            <p>
              <strong>Thời gian học:</strong>{" "}
              {new Date(data.semester.start_date).toLocaleDateString("vi-VN")} -{" "}
              {new Date(data.semester.end_date).toLocaleDateString("vi-VN")}
            </p>
          </div>

          {data.description && (
            <p className="mt-3 text-muted-foreground italic border-t pt-3">
              “{data.description}”
            </p>
          )}
        </div>

        {/* Giảng viên lý thuyết */}
        <div className="bg-card rounded-2xl shadow-md p-6 border border-border/30 hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-3">
            <School className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-blue-700">Giảng viên lý thuyết</h2>
          </div>

          <p className="font-medium">{data.lecturer.full_name}</p>
          <p className="text-sm text-muted-foreground mb-4">{data.lecturer.email}</p>

          {!semesterEnded && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Button onClick={() => handleChat(data.lecturer.id)}>
                <MessageCircle className="w-4 h-4 mr-1" /> Nhắn tin
              </Button>

              {userData?.role === "parent" && (
                <Button variant="outline" onClick={() => setModalVisible(true)} className="border-blue-500 text-blue-700">
                  <Calendar className="w-4 h-4 mr-1" /> Đặt lịch hẹn
                </Button>
              )}
            </div>
          )}

          <h3 className="font-semibold mt-4 mb-2 text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" /> Lịch học lý thuyết
          </h3>
          {data.schedule?.length > 0 ? (
            <ul className="text-sm space-y-1">
              {data.schedule.map((s: any) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
                >
                  <Calendar className="w-4 h-4" />
                  {dayNames[s.day_of_week]} · {s.building}
                  {s.classroom ? `.${s.classroom}` : ""} · Tiết {s.start_period}–{s.start_period + s.period_count - 1}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Không có lịch học.</p>
          )}
        </div>

        {/* Giảng viên thực hành */}
        {data.practice_group && (
          <div className="bg-card rounded-2xl shadow-md p-6 border border-border/30 hover:shadow-lg transition-all">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-emerald-700">
                Giảng viên thực hành
              </h2>
            </div>

            <p className="font-medium">{data.practice_group.lecturer.full_name}</p>
            <p className="text-sm text-muted-foreground mb-3">
              {data.practice_group.lecturer.email}
            </p>

            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              Nhóm: {data.practice_group.group_number} | Sĩ số:{" "}
              {data.practice_group.registered}/{data.practice_group.capacity}
            </div>

            {!semesterEnded && (
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() =>
                    handleChat(data.practice_group.lecturer.id)
                  }
                >
                  <MessageCircle className="w-4 h-4 mr-1" /> Nhắn tin
                </Button>

                {userData?.role === "parent" && (
                  <Button
                    variant="outline"
                    className="border-emerald-500 text-emerald-700"
                    onClick={() => setModalVisible(true)}
                  >
                    <Calendar className="w-4 h-4 mr-1" /> Đặt lịch hẹn
                  </Button>
                )}
              </div>
            )}

            <h3 className="font-semibold mt-4 mb-2 text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" /> Lịch học thực hành
            </h3>
            {data.practice_group.schedule?.length > 0 ? (
              <ul className="text-sm space-y-1">
                {data.practice_group.schedule.map((s: any) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
                  >
                    <Calendar className="w-4 h-4" />
                    {dayNames[s.day_of_week]} · {s.building}
                    {s.classroom ? `.${s.classroom}` : ""} · Tiết {s.start_period}–{s.start_period + s.period_count - 1}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Không có lịch học.</p>
            )}
          </div>
        )}
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
