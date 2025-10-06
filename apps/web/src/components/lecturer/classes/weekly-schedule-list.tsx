"use client";

import { Clock, CalendarDays } from "lucide-react";
import { WeeklySchedule } from "@packages/core/entities/WeeklySchedule";
import { Semester } from "@packages/core/entities/Semesters";


interface WeeklyScheduleListProps {
  schedules?: WeeklySchedule[];
  filterType?: string;
  showHighlight?: boolean;
  semester?: Semester;
}

export default function WeeklyScheduleList({
  schedules = [],
  filterType,
  showHighlight = true,
  semester,
}: WeeklyScheduleListProps) {
  const filtered = filterType
    ? schedules.filter((s) => s.type === filterType)
    : schedules;

  if (!filtered || filtered.length === 0) return null;

  const today = new Date();
  const todayIndex = today.getDay();
  const tomorrowIndex = (todayIndex + 1) % 7;

  const startDate = semester?.start_date ? new Date(semester.start_date) : null;
  const endDate = semester?.end_date ? new Date(semester.end_date) : null;

  const isInSemester =
    startDate && endDate ? today >= startDate && today <= endDate : true;

  const hasTodayClass =
    isInSemester && filtered.some((s) => s.day_of_week === todayIndex);

  const hasTomorrowClass =
    isInSemester &&
    !hasTodayClass &&
    filtered.some((s) => s.day_of_week === tomorrowIndex);

  const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

  const typeColor = (type: string) => {
    switch (type) {
      case "theory":
        return "bg-blue-100 text-blue-700";
      case "practice":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const scheduleText = filtered
    .map((w) => {
      const day = days[w.day_of_week] ?? `Thứ ${w.day_of_week}`;
      const time = `(T${w.start_period} - T${w.start_period + w.period_count - 1})`;
      const location =
        w.building && w.classroom
          ? `${w.building} (${w.classroom})`
          : w.building || w.classroom || "";
      const typeLabel = w.type === "theory" ? "Lý thuyết" : "Thực hành";

      const detail = [day, time, location, typeLabel]
        .filter(Boolean)
        .join(" • ");

      return detail;
    })
    .join("; ");

  return (
    <div className="flex flex-col gap-1 mb-2 text-sm text-muted-foreground">
      <div className="flex items-start gap-1">
        <Clock className="w-4 h-4 text-primary mt-[2px]" />
        <span className="font-medium text-foreground">
          Lịch học:
          <span className="ml-1 font-normal text-muted-foreground">
            {scheduleText}
          </span>
        </span>
      </div>

      {isInSemester ? (
        <>
          {hasTodayClass && (
            <div className="flex items-center gap-1 text-green-600 font-medium pl-5">
              <CalendarDays className="w-4 h-4" />
              Hôm nay có tiết
            </div>
          )}
          {!hasTodayClass && hasTomorrowClass && (
            <div className="flex items-center gap-1 text-amber-600 font-medium pl-5">
              <CalendarDays className="w-4 h-4" />
              Ngày mai có tiết
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-1 text-gray-500 italic pl-5">
          <CalendarDays className="w-4 h-4" />
          Ngoài thời gian học kỳ
        </div>
      )}
    </div>
  );
}
