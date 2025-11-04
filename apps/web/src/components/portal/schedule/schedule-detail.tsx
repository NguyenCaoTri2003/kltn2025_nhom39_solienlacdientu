"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/user-context";
import { useStudentSchedule } from "@/hooks/useStudentSchedule";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { ChevronLeft, ChevronRight, CalendarDays, RotateCcw, Calendar, CalendarSearch } from "lucide-react";
import { Card } from "@/components/ui/card";
import Loading from "@/components/ui/loading";

dayjs.locale("vi");

export default function ScheduleDetail() {
    const { userData } = useUser();
    const children = userData?.children || [];
    const isParent = userData?.role === "parent";

    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

    useEffect(() => {
        if (!userData) return;
        if (selectedStudentId) return;

        if (isParent && children.length > 0) {
            setSelectedStudentId(children[0].id);
        } else if (userData?.student?.id) {
            setSelectedStudentId(userData.student.id);
        }
    }, [userData, isParent, children, selectedStudentId]);

    const {
        schedules,
        loading,
        error,
        weekLabel,
        nextWeek,
        prevWeek,
        weekDays,
        setCurrentDate,
        resetToToday,
        baseDate,
    } = useStudentSchedule(selectedStudentId);

    const getSession = (period: number) => {
        if (period <= 6) return "morning";
        if (period <= 12) return "afternoon";
        return "evening";
    };

    const groupedSchedules = weekDays.map((day) => {
        const dateStr = day.format("YYYY-MM-DD");
        const dailySchedules = schedules.filter(
            (s) => dayjs(s.schedule_date).format("YYYY-MM-DD") === dateStr
        );

        return {
            day,
            morning: dailySchedules.filter((s) => getSession(s.start_period) === "morning"),
            afternoon: dailySchedules.filter((s) => getSession(s.start_period) === "afternoon"),
            evening: dailySchedules.filter((s) => getSession(s.start_period) === "evening"),
        };
    });

    const sessions = [
        { key: "morning", label: "Sáng" },
        { key: "afternoon", label: "Chiều" },
        { key: "evening", label: "Tối" },
    ];

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = dayjs(e.target.value);
        if (newDate.isValid()) {
            setSelectedDate(newDate.format("YYYY-MM-DD"));
            setCurrentDate?.(newDate);
        }
    };

    useEffect(() => {
        if (baseDate) {
            setSelectedDate(dayjs(baseDate).format("YYYY-MM-DD"));
        }
    }, [baseDate]);

    return (
        <div className="flex flex-col w-full h-full transition-all duration-300">
            {isParent && children.length > 0 && (
                <div className="flex overflow-x-auto gap-2 p-3 bg-indigo-50 rounded-lg">
                    {children.map((child) => (
                        <button
                            key={child.id}
                            onClick={() => setSelectedStudentId(child.id)}
                            className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedStudentId === child.id
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300"
                                }`}
                        >
                            {child?.users?.full_name}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-lg">
                    <CalendarDays className="w-6 h-6" />
                    <span>Lịch học, lịch thi theo tuần</span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={prevWeek}
                        disabled={loading}
                        className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-800/60 dark:text-indigo-300 transition disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Trở về</span>
                    </button>

                    <div className="flex items-center gap-2 font-semibold text-indigo-800 dark:text-indigo-300">
                        <Calendar className="w-4 h-4" />
                        <span>{weekLabel}</span>
                    </div>

                    <button
                        onClick={nextWeek}
                        disabled={loading}
                        className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-800/60 dark:text-indigo-300 transition disabled:opacity-50"
                    >
                        <span>Tiếp</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 px-2 py-1.5 rounded-md">
                        <CalendarSearch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            className="text-sm bg-transparent focus:outline-none dark:text-gray-200"
                        />
                    </div>

                    <button
                        onClick={() => resetToToday?.()}
                        className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Hiện tại</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 px-4 pb-6 overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loading text="Đang tải lịch tuần..." />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 mt-10">
                        Lỗi khi tải dữ liệu: {error}
                    </div>
                ) : (
                    <table className="min-w-full border-collapse rounded-lg overflow-hidden text-sm animate-fade-in">
                        <thead>
                            <tr className="bg-indigo-100 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100">
                                <th className="border p-2 text-left w-24">Buổi</th>
                                {groupedSchedules.map(({ day }) => (
                                    <th
                                        key={day.format("YYYY-MM-DD")}
                                        className="border p-2 text-center font-semibold"
                                    >
                                        {day.format("ddd")} <br />
                                        <span className="text-xs text-gray-600 dark:text-gray-300">
                                            {day.format("DD/MM/YYYY")}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {sessions.map((session) => (
                                <tr key={session.key} className="align-top">
                                    <td className="border p-2 font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                        {session.label}
                                    </td>
                                    {groupedSchedules.map(({ day, ...buoi }) => {
                                        const items = buoi[session.key as keyof typeof buoi] as any[];
                                        return (
                                            <td key={day.format("YYYY-MM-DD")} className="border p-2">
                                                {items.length === 0 ? (
                                                    <p className="text-gray-400 text-center text-xs italic">
                                                        Không có lịch
                                                    </p>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        {items.map((item) => (
                                                            <Card
                                                                key={item.id}
                                                                className={`p-2 border-l-4 ${item.type === "practice"
                                                                    ? "border-purple-500 bg-purple-50 dark:border-purple-500 "
                                                                    : "border-sky-500 bg-sky-50 dark:border-sky-500 "
                                                                    }`}
                                                            >
                                                                <p className="text-xs font-semibold">
                                                                    {item.course_offering.name}
                                                                </p>
                                                                <p className="text-[11px] text-gray-600 dark:text-gray-300">
                                                                    Tiết: {item.start_period}–{item.start_period + item.period_count - 1}
                                                                </p>
                                                                <p className="text-[11px] text-gray-600 dark:text-gray-300">
                                                                    Phòng: {item.classroom} ({item.building})
                                                                </p>
                                                                {item.lecturer && (
                                                                    <p className="text-[11px] text-gray-600 dark:text-gray-300">
                                                                        GV: {item.lecturer.full_name}
                                                                    </p>
                                                                )}
                                                            </Card>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
