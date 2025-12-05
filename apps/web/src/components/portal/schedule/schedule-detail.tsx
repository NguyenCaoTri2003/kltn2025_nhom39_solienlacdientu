"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/user-context";
import { useStudentSchedule } from "@/hooks/useStudentSchedule";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { ChevronLeft, ChevronRight, CalendarDays, RotateCcw, CalendarSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";
import EmptyState from "@/components/empty-state";
import { cn } from "@/lib/utils";

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

    console.log("schedules", schedules);

    const groupedSchedules = weekDays.map((day) => {
        const dateStr = day.format("YYYY-MM-DD");
        const dailySchedules = schedules.filter(
            (s) => dayjs(s.schedule_date).format("YYYY-MM-DD") === dateStr
        );

        return {
            day,
            morning: dailySchedules
                .filter((s) => getSession(s.start_period) === "morning")
                .sort((a, b) => a.start_period - b.start_period),

            afternoon: dailySchedules
                .filter((s) => getSession(s.start_period) === "afternoon")
                .sort((a, b) => a.start_period - b.start_period),

            evening: dailySchedules
                .filter((s) => getSession(s.start_period) === "evening")
                .sort((a, b) => a.start_period - b.start_period),
        }
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

    const colorMap: Record<string, string> = {
        practice: "border-emerald-500 dark:border-emerald-400 from-emerald-50/50 via-emerald-50/30 dark:from-emerald-800/30 dark:via-emerald-900/20",
        theory: "border-primary dark:border-blue-400 from-blue-50/50 via-blue-50/30 dark:from-blue-900/30 dark:via-blue-800/20",
        exam: "border-amber-500 dark:border-amber-400 from-amber-50/50 via-amber-50/30 dark:from-amber-900/30 dark:via-amber-800/20",
        cancelled: "border-red-500 dark:border-red-400 from-red-50/60 via-red-50/40 dark:from-red-900/30 dark:via-red-800/20",
    };

    useEffect(() => {
        if (baseDate) {
            setSelectedDate(dayjs(baseDate).format("YYYY-MM-DD"));
        }
    }, [baseDate]);

    return (
        <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
            <div className="space-y-5 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                {/* Tabs chọn con (nếu là phụ huynh) */}
                {isParent && children.length > 0 && (
                    <div className="flex gap-2 flex-wrap rounded-2xl border border-border/40 bg-muted/30 p-3">
                        {children.map((child: { id: number; users?: { full_name?: string } }) => (
                            <button
                                key={child.id}
                                onClick={() => setSelectedStudentId(child.id)}
                                className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 ${selectedStudentId === child.id
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-background/60 text-foreground hover:bg-muted"
                                    }`}
                            >
                                {child?.users?.full_name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Header và Controls */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                            <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">
                                Lịch học, lịch thi theo tuần
                            </h2>
                            <p className="text-sm text-muted-foreground">{weekLabel}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        <Button
                            onClick={prevWeek}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                            className="rounded-full border-border/50 bg-background/60 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.6)] backdrop-blur"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Trở về
                        </Button>

                        <div className="relative">
                            <CalendarSearch className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                className="pl-9 pr-3 h-10 rounded-full border border-border/50 bg-background/80 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.6)] backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 text-sm  dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:focus:ring-primary/50 dark:focus:border-primary/50"
                            />
                        </div>

                        <Button
                            onClick={() => resetToToday?.()}
                            size="sm"
                            className="flex items-center justify-center gap-1.5 rounded-full shadow-[0_4px_14px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)]"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Hiện tại</span>
                        </Button>

                        <Button
                            onClick={nextWeek}
                            disabled={loading}
                            variant="outline"
                            size="sm"
                            className="rounded-full border-border/50 bg-background/60 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.6)] backdrop-blur"
                        >
                            Tiếp
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-500/80"></div>
                        <span className="text-gray-700 dark:text-gray-300">Lịch học lý thuyết</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-emerald-500/80"></div>
                        <span className="text-gray-700 dark:text-gray-300">Lịch học thực hành</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-500/80"></div>
                        <span className="text-gray-700 dark:text-gray-300">Lịch thi</span>
                    </div>
                </div>


                {/* Schedule Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <CalendarDays className="h-7 w-7 animate-pulse" />
                                </div>
                                <p className="text-sm text-muted-foreground">Đang tải lịch tuần...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <EmptyState
                            icon={<CalendarDays className="w-10 h-10" />}
                            text={`Lỗi khi tải dữ liệu: ${error}`}
                        />
                    ) : (
                        <div className="rounded-2xl border border-border/60 bg-background/70 overflow-hidden shadow-inner shadow-black/5 backdrop-blur-lg">
                            <table className="min-w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border/60">
                                        <th className="p-3 text-left font-semibold text-foreground w-24">Buổi</th>
                                        {groupedSchedules.map(({ day }) => {
                                            const isToday = day.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
                                            return (
                                                <th
                                                    key={day.format("YYYY-MM-DD")}
                                                    className={`p-3 text-center font-semibold border-l border-border/40 ${isToday ? "bg-primary/5 text-primary" : "text-foreground"
                                                        }`}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-base">{day.format("ddd")}</span>
                                                        <span className="text-xs text-muted-foreground font-normal">
                                                            {day.format("DD/MM/YYYY")}
                                                        </span>
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>

                                <tbody>
                                    {sessions.map((session) => (
                                        <tr key={session.key} className="align-top border-b border-border/40 last:border-b-0">
                                            <td className="p-3 font-semibold bg-muted/10 text-foreground border-r border-border/40">
                                                {session.label}
                                            </td>
                                            {groupedSchedules.map(({ day, ...buoi }) => {
                                                const items = (buoi as any)[session.key] as Array<any>;
                                                const isToday = day.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
                                                return (
                                                    <td
                                                        key={day.format("YYYY-MM-DD")}
                                                        className={`p-2 border-l border-border/40 ${isToday ? "bg-primary/5" : ""}`}
                                                    >
                                                        {items.length === 0 ? (
                                                            <p className="text-muted-foreground text-center text-xs italic py-2">
                                                                Không có lịch
                                                            </p>
                                                        ) : (
                                                            <div className="flex flex-col gap-2">
                                                                {items.map((item) => (
                                                                    <Card
                                                                        key={item.id}
                                                                        className={cn(
                                                                            "relative rounded-xl border-l-4 p-3 transition-all hover:shadow-md bg-gradient-to-br to-background/60 dark:to-background/80 opacity-100",
                                                                            item.status === "cancelled" ? colorMap.cancelled : colorMap[item.type],
                                                                            item.status === "cancelled" && "opacity-70"
                                                                        )}
                                                                    >
                                                                        {item.status === "cancelled" && (
                                                                            <span className="absolute top-1 right-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-semibold">
                                                                                ĐÃ HỦY
                                                                            </span>
                                                                        )}
                                                                        <CardContent className="p-0 space-y-1.5">
                                                                            <p className="text-xs font-semibold text-foreground leading-tight">
                                                                                {item.course_offering.name}
                                                                            </p>
                                                                            <div className="space-y-1">
                                                                                <p className="text-[11px] text-muted-foreground dark:text-gray-400">
                                                                                    <span className="font-medium">{item?.course_offering?.class_name} - </span> {item?.course_offering?.class_code}
                                                                                </p>
                                                                                <p className="text-[11px] text-muted-foreground dark:text-gray-400">
                                                                                    <span className="font-medium">Tiết:</span> {item.start_period}–{item.start_period + item.period_count - 1}
                                                                                </p>
                                                                                <p className="text-[11px] text-muted-foreground dark:text-gray-400">
                                                                                    <span className="font-medium">Phòng:</span> {item.classroom} ({item.building})
                                                                                </p>
                                                                                {item.lecturer && (
                                                                                    <p className="text-[11px] text-muted-foreground dark:text-gray-400">
                                                                                        <span className="font-medium">GV:</span> {item.lecturer.full_name}
                                                                                    </p>
                                                                                )}
                                                                                {item.exam_info && (
                                                                                    <>
                                                                                        <p className="text-[11px] text-muted-foreground dark:text-gray-400">
                                                                                            <span className="font-medium">Nhóm:</span> {item.exam_info.exam_group_number} ({item.exam_info.exam_range_from} - {item.exam_info.exam_range_to})
                                                                                        </p>
                                                                                        {item.exam_info.lecturers && item.exam_info.lecturers.length > 0 && (
                                                                                            <p className="text-[11px] text-muted-foreground dark:text-gray-400">
                                                                                                <span className="font-medium">GV:</span> {item.exam_info.lecturers.map((l) => l.full_name).join(", ")}
                                                                                            </p>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </CardContent>
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
