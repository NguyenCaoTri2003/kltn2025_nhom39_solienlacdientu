import { useEffect, useState, useMemo } from "react";
import { fetchStudentSchedule, ScheduleItem } from "../services/scheduleService";
import dayjs from "dayjs";

export function useStudentSchedule(studentId: number | null | undefined) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startDate, endDate, weekLabel, weekDays } = useMemo(() => {
    const start = dayjs().startOf("week").add(weekOffset, "week");
    const end = start.endOf("week");
    const days = Array.from({ length: 7 }, (_, i) => start.add(i, "day"));
    return {
      startDate: start.format("YYYY-MM-DD"),
      endDate: end.format("YYYY-MM-DD"),
      weekLabel: `${start.format("DD/MM")} - ${end.format("DD/MM")}`,
      weekDays: days,
    };
  }, [weekOffset]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStudentSchedule(studentId, startDate, endDate);
      setSchedules(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchData();
  }, [studentId, startDate, endDate]);

  return {
    schedules,
    loading,
    error,
    weekLabel,
    weekDays,
    nextWeek: () => setWeekOffset((w) => w + 1),
    prevWeek: () => setWeekOffset((w) => w - 1),
  };
}