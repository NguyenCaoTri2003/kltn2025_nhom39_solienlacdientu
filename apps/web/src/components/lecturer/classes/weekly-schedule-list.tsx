"use client";

import { Clock, CalendarDays } from "lucide-react";
import { WeeklySchedule } from "@packages/core/entities/WeeklySchedule";
import { Semester } from "@packages/core/entities/Semesters";

interface WeeklyScheduleListProps {
  schedules?: WeeklySchedule[];
  filterType?: string;
  showHighlight?: boolean;
  semester?: Semester;
  practiceGroupNumber?: number;
}

export default function WeeklyScheduleList({
  schedules = [],
  filterType,
  showHighlight = true,
  semester,
  practiceGroupNumber,
}: WeeklyScheduleListProps) {
  let filtered = filterType
    ? schedules.filter((s) => s.type === filterType)
    : schedules;

  if (filterType === "practice" && practiceGroupNumber) {
    filtered = filtered.filter(
      (s) => s.practice_group_id === practiceGroupNumber
    );
  }

  if (!filtered || filtered.length === 0) return null;

  const today = new Date();
  const todayIndex = today.getDay();
  const tomorrowIndex = (todayIndex + 1) % 7;

  const normalizeDate = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const startDate = semester?.start_date
    ? normalizeDate(new Date(semester.start_date))
    : null;
  const endDate = semester?.end_date
    ? normalizeDate(new Date(semester.end_date))
    : null;
  const todayDate = normalizeDate(today);

  const isInSemester =
    startDate && endDate
      ? todayDate >= startDate && todayDate <= endDate
      : false;

  const hasTodayClass = filtered.some((s) => s.day_of_week === todayIndex);
  const hasTomorrowClass = filtered.some((s) => s.day_of_week === tomorrowIndex);

  const days = [
    "Chủ nhật",
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
  ];

  const scheduleText = filtered
    .map((w) => {
      const day = days[w.day_of_week] ?? `Thứ ${w.day_of_week}`;
      const time = `(T${w.start_period} - T${
        w.start_period + w.period_count - 1
      })`;
      const location =
        w.building && w.classroom
          ? `${w.building} (${w.classroom})`
          : w.building || w.classroom || "";

      return `${day} ${time} • ${location}`;
    })
    .join("; ");

  return (
    <div className="flex flex-col gap-1 mb-2 text-sm text-muted-foreground">
      <div className="flex items-start gap-1">
        <Clock className="w-4 h-4 text-primary mt-[2px]" />
        <span className="font-medium text-foreground">
          Lịch học:
          <span className="ml-1 font-normal text-muted-foreground">
            {scheduleText.split(";")[0]}
          </span>
        </span>
      </div>

      {showHighlight && (
        <>
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
        </>
      )}
    </div>
  );
}
