import { useEffect, useState, useMemo, useCallback } from "react";
import { fetchStudentSchedule, ScheduleItem } from "../services/scheduleService";
import dayjs, { Dayjs } from "dayjs";

export function useStudentSchedule(studentId: number | null | undefined) {
  const [baseDate, setBaseDate] = useState(dayjs()); 
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startDate, endDate, weekLabel, weekDays } = useMemo(() => {
    const start = baseDate.startOf("week"); 
    const end = start.endOf("week");
    const days = Array.from({ length: 7 }, (_, i) => start.add(i, "day"));

    return {
      startDate: start.format("YYYY-MM-DD"),
      endDate: end.format("YYYY-MM-DD"),
      weekLabel: `${start.format("DD/MM")} - ${end.format("DD/MM")}`,
      weekDays: days,
    };
  }, [baseDate]);

  const fetchData = useCallback(async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStudentSchedule(studentId, startDate, endDate);
      setSchedules(data);
    } catch (e: any) {
      console.error("Fetch schedule error:", e);
      setError(e.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [studentId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const nextWeek = () => setBaseDate((prev) => prev.add(1, "week"));
  const prevWeek = () => setBaseDate((prev) => prev.subtract(1, "week"));
  const resetToToday = () => setBaseDate(dayjs());
  const setCurrentDate = (date: Dayjs) => setBaseDate(date.startOf("day"));

  return {
    schedules,
    loading,
    error,
    weekLabel,
    weekDays,
    nextWeek,
    prevWeek,
    setCurrentDate,
    resetToToday,
    baseDate,
  };
}
