"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Layers,
    CalendarDays,
    Clock,
    ArrowRight,
    BookText,
    Calendar,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface Semester {
    id: number;
    name: string;
    academic_year: string;
    start_date: string;
    end_date: string;
}

interface WeeklySchedule {
    id: number;
    type: string;
    building: string;
    classroom: string;
    day_of_week: number;
    period_count: number;
    start_period: number;
    practice_group_id?: number | null;
}

interface PracticeGroup {
    id: number;
    lecturer_id: number;
    schedule?: any;
}

interface CourseOffering {
    id: number;
    name: string;
    class_code: string;
    registered: number;
    weekly_schedules: WeeklySchedule[];
    practice_groups?: PracticeGroup[];
    is_practice_lecturer?: boolean;
    practice_group_number?: number | null;
}

interface Appointment {
    id: number;
    title: string;
    content: string;
    location: string;
    start_time: string;
    end_time: string;
    parent: { users: { full_name: string } };
    student: { users: { full_name: string } };
}

export default function LecturerDashboard() {
    const [user, setUser] = useState<{ id: number; name?: string } | null>(null);
    const [currentSemester, setCurrentSemester] = useState<Semester | null>(null);
    const [offerings, setOfferings] = useState<CourseOffering[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Lấy thông tin user từ localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem("user");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && (parsed.id || parsed.id === 0))
                    setUser({ id: parsed.id, name: parsed.name || parsed.full_name });
            }
        } catch (e) {
            console.warn("Không thể đọc user từ localStorage", e);
        }
    }, []);

    // Lấy học kỳ hiện tại
    useEffect(() => {
        const fetchSemesters = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/semesters`);
                const json = await res.json();
                if (json.returnCode === 0 && Array.isArray(json.data)) {
                    const data: Semester[] = json.data;
                    const today = new Date();
                    const current = data.find((s) => {
                        const start = s.start_date ? new Date(s.start_date) : null;
                        const end = s.end_date ? new Date(s.end_date) : null;
                        return start && end && today >= start && today <= end;
                    });
                    setCurrentSemester(current || data[data.length - 1] || null);
                } else toast.error("Không thể tải danh sách học kỳ.");
            } catch {
                toast.error("Lỗi khi tải danh sách học kỳ.");
            }
        };
        fetchSemesters();
    }, []);

    // Lấy lớp học phần giảng viên dạy trong học kỳ
    useEffect(() => {
        if (!currentSemester?.id) return;
        const fetchOfferings = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/offerings/lecturer?semester_id=${currentSemester.id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                const json = await res.json();
                if (json.returnCode === 0) setOfferings(json.data);
                else {
                    setOfferings([]);
                }
            } catch {
                toast.error("Lỗi khi tải danh sách lớp học phần.");
            } finally {
                setLoading(false);
            }
        };
        fetchOfferings();
    }, [currentSemester]);

    // Lấy lịch hẹn hôm nay
    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    const today = new Date();
                    const filtered = data.filter((a) => {
                        const start = new Date(a.start_time);
                        return (
                            start.getDate() === today.getDate() &&
                            start.getMonth() === today.getMonth() &&
                            start.getFullYear() === today.getFullYear()
                        );
                    });
                    setAppointments(filtered);
                } else setAppointments([]);
            } catch {
                toast.error("Không thể tải lịch hẹn hôm nay.");
            }
        };
        fetchAppointments();
    }, []);

    const weekday = new Date().getDay();
    const weekdayMap: Record<number, string> = {
        0: "Chủ nhật",
        1: "Thứ 2",
        2: "Thứ 3",
        3: "Thứ 4",
        4: "Thứ 5",
        5: "Thứ 6",
        6: "Thứ 7",
    };

    // Lọc lịch học hôm nay 
    const todaySchedules = offerings
        .flatMap((offering) =>
            (offering.weekly_schedules || []).map((s) => {
                const pg = offering.practice_groups || [];
                const practiceGroup = s.practice_group_id
                    ? pg.find((g) => g.id === s.practice_group_id)
                    : undefined;
                const isMyPractice = Boolean(
                    practiceGroup && user && practiceGroup.lecturer_id === user.id
                );
                let groupNumber: number | null = null;
                if (s.practice_group_id && pg.length > 0) {
                    const index = pg.findIndex((g) => g.id === s.practice_group_id);
                    groupNumber = index !== -1 ? index + 1 : null;
                }
                return {
                    ...s,
                    offeringId: offering.id,
                    courseName: offering.name,
                    classCode: offering.class_code,
                    isPractice: s.type === "practice",
                    isMyPractice,
                    groupNumber,
                };
            })
        )
        .filter((s) => s.type === "theory" || (s.type === "practice" && s.isMyPractice))
        .filter((s) => s.day_of_week === weekday)
        .sort((a, b) => a.start_period - b.start_period);

    const today = new Date();

    // Gộp các lịch hẹn trùng thông tin
    const groupedAppointments = Object.values(
        appointments.reduce((acc, a) => {
            const key = `${a.student.users.full_name}-${a.start_time}-${a.end_time}-${a.title}`;
            if (!acc[key]) {
                acc[key] = { ...a, parents: [a.parent.users.full_name] };
            } else {
                acc[key].parents.push(a.parent.users.full_name);
            }
            return acc;
        }, {} as Record<string, Appointment & { parents: string[] }>)
    );

    return (
        <div className="min-h-screen bg-background py-8 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="w-full flex flex-col items-start mb-8 px-4">
                    {loading ? (
                        <>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Bảng điều khiển Giảng viên
                            </h1>
                            <Skeleton className="h-4 w-96" />
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold tracking-tight">
                                Bảng điều khiển Giảng viên
                            </h1>
                            {currentSemester && (
                                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4" />
                                    <span>
                                        {currentSemester.name} - {currentSemester.academic_year} —{" "}
                                        {weekdayMap[weekday]}, ngày {today.getDate()} tháng{" "}
                                        {today.getMonth() + 1} năm {today.getFullYear()}
                                    </span>
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Cards tổng quan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    {loading ? (
                        <>
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </>
                    ) : (
                        <>
                            <Card>
                                <CardContent className="p-5 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Lớp học phần hôm nay</p>
                                        <p className="text-2xl font-bold">{todaySchedules.length}</p>
                                    </div>
                                    <Layers className="w-8 h-8 text-blue-500" />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-5 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Lịch hẹn hôm nay</p>
                                        <p className="text-2xl font-bold">{appointments.length}</p>
                                    </div>
                                    <Clock className="w-8 h-8 text-amber-500" />
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Nội dung chính */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Lịch học hôm nay */}
                    <Card className={cn("flex-1 w-full lg:w-1/2", loading && "opacity-50")}>
                        <CardHeader>
                            <CardTitle>Lịch học hôm nay</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? (
                                <>
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-16 w-full" />
                                    <Skeleton className="h-16 w-full" />
                                </>
                            ) : todaySchedules.length === 0 ? (
                                <EmptyState
                                    icon={<Calendar className="w-10 h-10" />}
                                    text="Hôm nay không có lịch học nào."
                                />
                            ) : (
                                todaySchedules.map((s, i) => (
                                    <div
                                        key={i}
                                        className="group p-4 border rounded-xl bg-background flex items-center justify-between cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
                                        onClick={() => router.push(`/lecturer/classes/${s.offeringId}`)}
                                    >
                                        <div className="flex flex-col justify-center">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-foreground text-lg">
                                                    {s.courseName}{" "}
                                                    <span className="text-muted-foreground text-sm">
                                                        ({s.classCode})
                                                    </span>
                                                </span>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "px-2 py-0.5 text-xs font-medium rounded-full",
                                                        s.isPractice
                                                            ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                                    )}
                                                >
                                                    {s.isPractice ? "Thực hành" : "Lý thuyết"}
                                                </Badge>
                                                {s.isPractice && s.groupNumber && s.isMyPractice && (
                                                    <Badge className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                        Nhóm {s.groupNumber}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                                                <span>
                                                    {s.building}-{s.classroom} • Tiết {s.start_period} →{" "}
                                                    {s.start_period + s.period_count - 1}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    </div>


                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Lịch hẹn hôm nay */}
                    <Card className={cn("flex-1 w-full lg:w-1/2", loading && "opacity-50")}>
                        <CardHeader>
                            <CardTitle>Lịch hẹn hôm nay</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {loading ? (
                                <>
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                </>
                            ) : groupedAppointments.length === 0 ? (
                                <EmptyState
                                    icon={<CalendarDays className="w-10 h-10" />}
                                    text="Hôm nay không có lịch hẹn nào."
                                />
                            ) : (
                                groupedAppointments.map((a) => (
                                    <div
                                        key={a.id + a.start_time}
                                        className="group p-4 border rounded-xl bg-background hover:bg-secondary/80 transition-all duration-200 space-y-2 cursor-pointer hover:shadow-md hover:border-primary/30"
                                        onClick={() => router.push(`/lecturer/appointments`)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">{a.title}</span>
                                            <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                                {new Date(a.start_time).toLocaleTimeString("vi-VN", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}{" "}
                                                -{" "}
                                                {new Date(a.end_time).toLocaleTimeString("vi-VN", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Phụ huynh:{" "}
                                            <span className="font-medium text-foreground">
                                                {a.parents.join(", ")}
                                            </span>{" "}
                                            • Học sinh:{" "}
                                            <span className="font-medium text-foreground">
                                                {a.student.users.full_name}
                                            </span>
                                        </p>
                                        {a.location && (
                                            <p className="text-sm text-muted-foreground">
                                                Địa điểm: {a.location}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
