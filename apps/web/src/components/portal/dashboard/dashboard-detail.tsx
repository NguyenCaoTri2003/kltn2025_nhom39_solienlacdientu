"use client";

import { useMemo } from "react";
import { useUser } from "@/context/user-context";
import { useCourseOfferings } from "@/hooks/useCourseOfferings";
import { useAppointment } from "@/hooks/useAppointment";
import { format, isToday, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import Image from "next/image";
import {
  Calendar,
  BookOpen,
  Users,
  GraduationCap,
  Clock,
  Sun,
  CloudSun,
  Moon,
  Book,
} from "lucide-react";
import { getAvatarColor } from "@/utils/color-hash";
import Loading from "@/components/ui/loading";
import { motion } from "framer-motion";
import { translateTrainingLevel, translateTrainingType } from "@/utils/get-status-profile";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/empty-state";

export default function Dashboard() {
  const { userData } = useUser();
  const isParent = userData?.role === "parent";
  const activeChild = isParent ? userData?.children?.[0] : null;
  const studentId = isParent ? activeChild?.id : userData?.student?.id;
  const studentYear = isParent ? activeChild?.academic_year : userData?.student?.academic_year;
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") ?? undefined
      : undefined;
  const router = useRouter();

  const { semester, offerings, loading } = useCourseOfferings(studentYear, studentId);
  const { appointments, loading: appointmentsLoading } = useAppointment(token);
  const isLoading = loading || (isParent && appointmentsLoading);

  const todayAppointments = useMemo(
    () => appointments.filter((a) => isToday(parseISO(a.start_time || a.date || ""))),
    [appointments]
  );

  const todayClasses = useMemo(() => {
    if (!offerings) return [];
    const todayIndex = new Date().getDay();
    return offerings.filter((o) =>
      o.detail?.schedule?.some((s: { day_of_week: number }) => {
        const dayOfWeek = Number(s.day_of_week) % 7;
        return dayOfWeek === todayIndex;
      })
    );
  }, [offerings]);

  const initial = useMemo(() => {
    const name = userData?.full_name?.trim() ?? "";
    const parts = name ? name.split(" ") : [];
    const last = parts.length > 0 ? parts[parts.length - 1] : "";
    return last?.[0]?.toUpperCase() ?? "?";
  }, [userData?.full_name]);

  const bgColor = useMemo(
    () =>
      getAvatarColor(
        userData?.id != null ? String(userData?.id) : userData?.full_name ?? "?"
      ),
    [userData?.id, userData?.full_name]
  );

  function getDayName(day: number) {
    const days = [
      "Chủ nhật",
      "Thứ hai",
      "Thứ ba",
      "Thứ tư",
      "Thứ năm",
      "Thứ sáu",
      "Thứ bảy",
    ];
    return days[day] || "Không rõ";
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Chào buổi sáng", icon: <Sun /> };
    if (hour < 18) return { text: "Chào buổi chiều", icon: <CloudSun /> };
    return { text: "Chào buổi tối", icon: <Moon /> };
  }

  const greeting = getGreeting();
  const nameToShow = userData?.full_name || (isParent ? "Phụ huynh" : "Sinh viên");

  const iconColor = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "text-yellow-400";
    if (hour < 18) return "text-orange-400";
    return "text-indigo-400";
  }, []);

  if (!userData || isLoading) {
    return (
      <div className="flex items-center justify-center">
        <Loading text="Đang tải dữ liệu..." />
      </div>
    );
  }

  const cardStyle =
    "bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-md rounded-xl p-5 transition-all duration-150 backdrop-blur-md hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 hover:bg-white/90 dark:hover:bg-gray-800/90";

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
      <div className="rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <motion.div
          className="relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Greeting */}
        <motion.div
          className="col-span-3 flex items-center gap-3"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className={iconColor}
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
          >
            {greeting.icon}
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-indigo-800 dark:text-indigo-300 drop-shadow">
            {greeting.text}, {nameToShow}!
          </h1>
        </motion.div>

        {/* Thông tin người dùng */}
        <motion.div
          className={`${cardStyle} col-span-3 flex flex-col md:flex-row gap-6`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex-shrink-0">
            {userData?.avatar_url ? (
              <Image
                src={userData.avatar_url}
                alt={userData.full_name || "Avatar"}
                width={120}
                height={120}
                className="rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow"
              />
            ) : (
              <div
                className={`${bgColor} w-28 h-28 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow`}
              >
                {initial}
              </div>
            )}
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700 dark:text-gray-300 text-sm">
            {isParent ? (
              <>
                <p><span className="font-semibold">Họ tên:</span> {userData.full_name}</p>
                <p><span className="font-semibold">SĐT:</span> {userData.phone || "Chưa có"}</p>
                <p><span className="font-semibold">Email:</span> {userData.email || "Chưa có"}</p>
                <p><span className="font-semibold">CCCD:</span> {userData.citizen_id_card || "Chưa có"}</p>
                <p className="sm:col-span-2"><span className="font-semibold">Địa chỉ:</span> {userData.address || "Chưa có"}</p>
                <p><span className="font-semibold">Số con:</span> {userData.children?.length || 0}</p>
              </>
            ) : (
              <>
                <p><span className="font-semibold">MSSV:</span> {userData.student?.student_code}</p>
                <p><span className="font-semibold">Họ tên:</span> {userData.full_name}</p>
                <p><span className="font-semibold">Giới tính:</span> Nam</p>
                <p><span className="font-semibold">Ngày sinh:</span> {userData.student?.date_of_birth?.split("T")[0]}</p>
                <p><span className="font-semibold">Nơi sinh:</span> {userData.student?.place_of_birth}</p>
                <p><span className="font-semibold">Lớp học:</span> {userData.student?.classes?.class_code || "Chưa có"}</p>
                <p><span className="font-semibold">Khóa học:</span> {userData.student?.academic_year}</p>
                <p><span className="font-semibold">Bậc đào tạo:</span> {translateTrainingLevel(userData.student?.training_level)}</p>
                <p><span className="font-semibold">Loại hình đào tạo:</span> {translateTrainingType(userData.student?.type_of_tranning)}</p>
                <p><span className="font-semibold">Ngành:</span> Kỹ thuật phần mềm</p>
              </>
            )}
          </div>
        </motion.div>

        {/* Nội dung chính */}
        {isParent ? (
          <>
            {/* Danh sách con */}
            <motion.div
              className={`${cardStyle} xl:col-span-1 overflow-y-auto max-h-[400px]`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <Users className="w-5 h-5 text-blue-500" /> Thông tin con
              </h3>
              <div className="flex flex-col gap-3">
                {userData?.children?.map((child) => (
                  <motion.div
                    key={child.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-150 cursor-pointer"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {child.users.full_name}
                    </p>
                    <p className="text-sm">Mã SV: {child.student_code}</p>
                    <p className="text-sm">Lớp: {child.classes?.class_code}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Lịch hẹn hôm nay */}
            <motion.div
              className={`${cardStyle} xl:col-span-2 overflow-y-auto max-h-[400px]`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <Calendar className="w-5 h-5 text-orange-500" /> Lịch hẹn hôm nay
              </h3>
              <div className="flex flex-col gap-3">
                {todayAppointments.length > 0 ? (
                  todayAppointments.map((a) => (
                    <motion.div
                      key={a.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-150"
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={() => router.push(`/portal/appointments`)}
                    >
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{a.title}</p>
                      <p className="text-sm flex items-center gap-1">
                        <Clock className="w-4 h-4" />{" "}
                        {format(parseISO(a.start_time), "HH:mm", { locale: vi })} -{" "}
                        {format(parseISO(a.end_time), "HH:mm", { locale: vi })}
                      </p>
                      {a.location && <p className="text-sm">Địa điểm: {a.location}</p>}
                    </motion.div>
                  ))
                ) : (
                  <EmptyState
                    icon={<Calendar className="w-10 h-10" />}
                    text="Không có lịch hẹn nào hôm nay."
                    className="py-1 px-2"
                  />
                )}
              </div>
            </motion.div>
          </>
        ) : (
          <>
            {/* Môn học hôm nay */}
            <motion.div
              className={`${cardStyle} xl:col-span-1 overflow-y-auto max-h-[400px]`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <BookOpen className="w-5 h-5 text-green-500" /> Môn học hôm nay
              </h3>
              <div className="flex flex-col gap-3">
                {todayClasses.length > 0 ? (
                  todayClasses.map((c) => (
                    <motion.div
                      key={c.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 transition-all duration-150"
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={() => router.push(`/portal/classes/${c.id}`)}
                    >
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {c.course?.name || c.name || "Không rõ tên"}
                      </p>
                      <p className="text-sm flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" /> Mã lớp: {c.class_code}
                      </p>
                      <p className="text-sm flex items-center gap-1">
                        Giảng viên:{" "}
                        {c.lecturer?.full_name ||
                          c.detail?.lecturer?.full_name ||
                          "Chưa rõ"}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <EmptyState
                    icon={<Calendar className="w-10 h-10" />}
                    text="Không có lớp học phần hôm nay."
                    className="py-1"
                  />
                )}
              </div>
            </motion.div>

            {/* Tất cả lớp học phần */}
            <motion.div
              className={`${cardStyle} xl:col-span-2 overflow-y-auto max-h-[600px]`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <BookOpen className="w-5 h-5 text-indigo-500" /> Tất cả lớp học phần -{" "}
                {semester?.name}
              </h3>
              {offerings?.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {offerings.map((c) => (
                    <motion.div
                      key={c.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-150"
                      whileHover={{ scale: 1.02, y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={() => router.push(`/portal/classes/${c.id}`)}
                    >
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {c.course?.name || c.name || "Không rõ tên"}
                      </p>
                      <p className="text-sm flex items-center gap-1">
                        <GraduationCap className="w-4 h-4" /> Mã lớp: {c.class_code}
                      </p>
                      <p className="text-sm flex items-center gap-1">
                        Giảng viên:{" "}
                        {c.lecturer?.full_name ||
                          c.detail?.lecturer?.full_name ||
                          "Chưa rõ"}
                      </p>
                      {c.detail?.schedule?.map((s: { day_of_week: number; start_period: number; period_count: number; classroom: string; building: string }, i: number) => (
                        <p key={i} className="text-sm flex items-center gap-1">
                          <Calendar className="w-4 h-4" />{" "}
                          {getDayName(Number(s.day_of_week))} - Tiết {s.start_period} →{" "}
                          {s.start_period + s.period_count - 1} tại {s.classroom} ({s.building})
                        </p>
                      ))}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Book className="w-10 h-10" />}
                  text="Không có lớp học phần nào."
                  className="py-1"
                />
              )}
            </motion.div>
          </>
        )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
