"use client";

import { Clock } from "lucide-react";

interface WeeklySchedule {
  day_of_week: number;
  start_period: number;
  period_count: number;
  classroom?: string | null;
  building?: string | null;
  type: string;
}

interface WeeklyScheduleListProps {
  schedules?: WeeklySchedule[];
  filterType?: string;
}

export default function WeeklyScheduleList({
  schedules = [],
  filterType,
}: WeeklyScheduleListProps) {
  const filtered = filterType
    ? schedules.filter((s) => s.type === filterType)
    : schedules;

  if (!filtered || filtered.length === 0) return null;

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

  return (
    <div className="flex flex-col gap-1 mb-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-1 mb-1">
        <Clock className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">Lịch học:</span>
      </div>

      {filtered.map((w, idx) => {
        const day = days[w.day_of_week] ?? `Thứ ${w.day_of_week}`;
        const time = `(T${w.start_period} - T${w.start_period + w.period_count - 1})`;
        const location =
          w.building && w.classroom
            ? `${w.building} (${w.classroom})`
            : w.building || w.classroom || "";
        const typeLabel = w.type === "theory" ? "Lý thuyết" : "Thực hành";

        return (
          <div
            key={idx}
            className="flex items-center flex-wrap gap-2 pl-5 text-[13px] text-muted-foreground"
          >
            <span>{`${day} ${time}`}</span>

            {location && (
              <>
                <span>•</span>
                <span>{location}</span>
              </>
            )}

            <span
              className={`px-2 py-[1px] rounded-full text-[12px] font-medium ${typeColor(
                w.type
              )}`}
            >
              {typeLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
