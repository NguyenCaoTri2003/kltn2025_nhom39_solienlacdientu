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
import { motion } from "framer-motion";
import Loading from "@/components/ui/loading";

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
    //schedule?: any;
    schedule?: unknown;
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

    //     <div className="py-8 px-6">
    //         <div className="max-w-7xl mx-auto">
    //             {/* Header */}
    //             <div className="w-full flex flex-col items-start mb-8 px-4">
    //                 {loading ? (
    //                     <>
    //                         <h1 className="text-3xl font-bold tracking-tight">
    //                             Bảng điều khiển Giảng viên
    //                         </h1>
    //                         <Skeleton className="h-4 w-96" />
    //                     </>
    //                 ) : (
    //                     <>
    //                         <h1 className="text-3xl font-bold tracking-tight">
    //                             Bảng điều khiển Giảng viên
    //                         </h1>
    //                         {currentSemester && (
    //                             <p className="text-muted-foreground mt-1 flex items-center gap-2">
    //                                 <CalendarDays className="w-4 h-4" />
    //                                 <span>
    //                                     {currentSemester.name} - {currentSemester.academic_year} —{" "}
    //                                     {weekdayMap[weekday]}, ngày {today.getDate()} tháng{" "}
    //                                     {today.getMonth() + 1} năm {today.getFullYear()}
    //                                 </span>
    //                             </p>
    //                         )}
    //                     </>
    //                 )}
    //             </div>

    //             {/* Cards tổng quan */}
    //             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
    //                 {loading ? (
    //                     <>
    //                         <Skeleton className="h-24 w-full" />
    //                         <Skeleton className="h-24 w-full" />
    //                     </>
    //                 ) : (
    //                     <>
    //                         <Card>
    //                             <CardContent className="p-5 flex justify-between items-center">
    //                                 <div>
    //                                     <p className="text-sm text-muted-foreground">Lớp học phần hôm nay</p>
    //                                     <p className="text-2xl font-bold">{todaySchedules.length}</p>
    //                                 </div>
    //                                 <Layers className="w-8 h-8 text-blue-500" />
    //                             </CardContent>
    //                         </Card>

    //                         <Card>
    //                             <CardContent className="p-5 flex justify-between items-center">
    //                                 <div>
    //                                     <p className="text-sm text-muted-foreground">Lịch hẹn hôm nay</p>
    //                                     <p className="text-2xl font-bold">{appointments.length}</p>
    //                                 </div>
    //                                 <Clock className="w-8 h-8 text-amber-500" />
    //                             </CardContent>
    //                         </Card>
    //                     </>
    //                 )}
    //             </div>

    //             {/* Nội dung chính */}
    //             <div className="flex flex-col lg:flex-row gap-8 items-start">
    //                 {/* Lịch học hôm nay */}
    //                 <Card className={cn("flex-1 w-full lg:w-1/2", loading && "opacity-50")}>
    //                     <CardHeader>
    //                         <CardTitle>Lịch học hôm nay</CardTitle>
    //                     </CardHeader>
    //                     <CardContent className="space-y-3">
    //                         {loading ? (
    //                             <>
    //                                 <Skeleton className="h-16 w-full" />
    //                                 <Skeleton className="h-16 w-full" />
    //                                 <Skeleton className="h-16 w-full" />
    //                             </>
    //                         ) : todaySchedules.length === 0 ? (
    //                             <EmptyState
    //                                 icon={<Calendar className="w-10 h-10" />}
    //                                 text="Hôm nay không có lịch học nào."
    //                             />
    //                         ) : (
    //                             todaySchedules.map((s, i) => (
    //                                 <div
    //                                     key={i}
    //                                     className="group p-4 border rounded-xl bg-background flex items-center justify-between cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
    //                                     onClick={() => router.push(`/lecturer/classes/${s.offeringId}`)}
    //                                 >
    //                                     <div className="flex flex-col justify-center">
    //                                         <div className="flex flex-wrap items-center gap-2">
    //                                             <span className="font-semibold text-foreground text-lg">
    //                                                 {s.courseName}{" "}
    //                                                 <span className="text-muted-foreground text-sm">
    //                                                     ({s.classCode})
    //                                                 </span>
    //                                             </span>
    //                                             <Badge
    //                                                 variant="outline"
    //                                                 className={cn(
    //                                                     "px-2 py-0.5 text-xs font-medium rounded-full",
    //                                                     s.isPractice
    //                                                         ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
    //                                                         : "bg-blue-500/10 text-blue-600 border-blue-500/20"
    //                                                 )}
    //                                             >
    //                                                 {s.isPractice ? "Thực hành" : "Lý thuyết"}
    //                                             </Badge>
    //                                             {s.isPractice && s.groupNumber && s.isMyPractice && (
    //                                                 <Badge className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
    //                                                     Nhóm {s.groupNumber}
    //                                                 </Badge>
    //                                             )}
    //                                         </div>

    //                                         <div className="flex items-center text-sm text-muted-foreground mt-1">
    //                                             <span>
    //                                                 {s.building}-{s.classroom} • Tiết {s.start_period} →{" "}
    //                                                 {s.start_period + s.period_count - 1}
    //                                             </span>
    //                                         </div>
    //                                     </div>

    //                                     <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
    //                                         <ArrowRight className="w-5 h-5 text-muted-foreground" />
    //                                     </div>
    //                                 </div>


    //                             ))
    //                         )}
    //                     </CardContent>
    //                 </Card>

    //                 {/* Lịch hẹn hôm nay */}
    //                 <Card className={cn("flex-1 w-full lg:w-1/2", loading && "opacity-50")}>
    //                     <CardHeader>
    //                         <CardTitle>Lịch hẹn hôm nay</CardTitle>
    //                     </CardHeader>
    //                     <CardContent className="space-y-3">
    //                         {loading ? (
    //                             <>
    //                                 <Skeleton className="h-20 w-full" />
    //                                 <Skeleton className="h-20 w-full" />
    //                             </>
    //                         ) : groupedAppointments.length === 0 ? (
    //                             <EmptyState
    //                                 icon={<CalendarDays className="w-10 h-10" />}
    //                                 text="Hôm nay không có lịch hẹn nào."
    //                             />
    //                         ) : (
    //                             groupedAppointments.map((a) => (
    //                                 <div
    //                                     key={a.id + a.start_time}
    //                                     className="group p-4 border rounded-xl bg-background hover:bg-secondary/80 transition-all duration-200 space-y-2 cursor-pointer hover:shadow-md hover:border-primary/30"
    //                                     onClick={() => router.push(`/lecturer/appointments`)}
    //                                 >
    //                                     <div className="flex justify-between items-center">
    //                                         <span className="font-semibold">{a.title}</span>
    //                                         <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
    //                                             {new Date(a.start_time).toLocaleTimeString("vi-VN", {
    //                                                 hour: "2-digit",
    //                                                 minute: "2-digit",
    //                                             })}{" "}
    //                                             -{" "}
    //                                             {new Date(a.end_time).toLocaleTimeString("vi-VN", {
    //                                                 hour: "2-digit",
    //                                                 minute: "2-digit",
    //                                             })}
    //                                         </Badge>
    //                                     </div>
    //                                     <p className="text-sm text-muted-foreground">
    //                                         Phụ huynh:{" "}
    //                                         <span className="font-medium text-foreground">
    //                                             {a.parents.join(", ")}
    //                                         </span>{" "}
    //                                         • Học sinh:{" "}
    //                                         <span className="font-medium text-foreground">
    //                                             {a.student.users.full_name}
    //                                         </span>
    //                                     </p>
    //                                     {a.location && (
    //                                         <p className="text-sm text-muted-foreground">
    //                                             Địa điểm: {a.location}
    //                                         </p>
    //                                     )}
    //                                 </div>
    //                             ))
    //                         )}
    //                     </CardContent>
    //                 </Card>
    //             </div>
    //         </div>
    //     </div>
    // );

    // V2
//     return (
//         <motion.div
//             className="py-8 px-6"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.6 }}
//         >
//             <div className="max-w-7xl mx-auto space-y-8">
//                 {/* Header */}
//                 <motion.div
//                     className="w-full flex flex-col items-start px-4"
//                     initial={{ y: -10, opacity: 0 }}
//                     animate={{ y: 0, opacity: 1 }}
//                     transition={{ duration: 0.6 }}
//                 >
//                     <h1 className="text-3xl font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
//                         Bảng điều khiển Giảng viên
//                     </h1>
//                     {currentSemester && (
//                         <p className="text-muted-foreground mt-1 flex items-center gap-2">
//                             <CalendarDays className="w-4 h-4" />
//                             <span>
//                                 {currentSemester.name} - {currentSemester.academic_year} —{" "}
//                                 {weekdayMap[today.getDay()]}, ngày {today.getDate()} tháng{" "}
//                                 {today.getMonth() + 1} năm {today.getFullYear()}
//                             </span>
//                         </p>
//                     )}
//                 </motion.div>

//                 {loading ? (
//                     <div className="flex items-center justify-center h-[60vh]">
//                         <Loading text="Đang tải dữ liệu..." />
//                     </div>
//                 ) : (
//                     <>
//                         <motion.div
//                             className="grid grid-cols-1 sm:grid-cols-2 gap-6"
//                             initial={{ y: 10, opacity: 0 }}
//                             animate={{ y: 0, opacity: 1 }}
//                             transition={{ duration: 0.6, delay: 0.2 }}
//                         >
//                             <motion.div
//                                 whileHover={{ scale: 1.03 }}
//                                 transition={{ type: "spring", stiffness: 200 }}
//                             >
//                                 <Card className="shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 backdrop-blur-md">
//                                     <CardContent className="p-5 flex justify-between items-center">
//                                         <div>
//                                             <p className="text-sm text-muted-foreground">
//                                                 Lớp học phần hôm nay
//                                             </p>
//                                             <p className="text-2xl font-bold text-foreground">
//                                                 {todaySchedules.length}
//                                             </p>
//                                         </div>
//                                         <Layers className="w-8 h-8 text-blue-500" />
//                                     </CardContent>
//                                 </Card>
//                             </motion.div>

//                             <motion.div
//                                 whileHover={{ scale: 1.03 }}
//                                 transition={{ type: "spring", stiffness: 200 }}
//                             >
//                                 <Card className="shadow-md hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700 backdrop-blur-md">
//                                     <CardContent className="p-5 flex justify-between items-center">
//                                         <div>
//                                             <p className="text-sm text-muted-foreground">
//                                                 Lịch hẹn hôm nay
//                                             </p>
//                                             <p className="text-2xl font-bold text-foreground">
//                                                 {appointments.length}
//                                             </p>
//                                         </div>
//                                         <Clock className="w-8 h-8 text-amber-500" />
//                                     </CardContent>
//                                 </Card>
//                             </motion.div>
//                         </motion.div>

//                         {/* Nội dung chính */}
//                         <div className="flex flex-col lg:flex-row gap-8 items-start">
//                             {/* Lịch học hôm nay */}
//                             <motion.div
//                                 className={cn("flex-1 w-full lg:w-1/2")}
//                                 initial={{ y: 10, opacity: 0 }}
//                                 animate={{ y: 0, opacity: 1 }}
//                                 transition={{ duration: 0.6, delay: 0.3 }}
//                             >
//                                 <Card className="shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-md transition-all">
//                                     <CardHeader>
//                                         <CardTitle>Lịch học hôm nay</CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-3">
//                                         {todaySchedules.length === 0 ? (
//                                             <EmptyState
//                                                 icon={<Calendar className="w-10 h-10" />}
//                                                 text="Hôm nay không có lịch học nào."
//                                             />
//                                         ) : (
//                                             todaySchedules.map((s, i) => (
//                                                 <motion.div
//                                                     key={i}
//                                                     className="group p-4 border rounded-xl bg-background flex items-center justify-between cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
//                                                     whileHover={{ scale: 1.02 }}
//                                                     onClick={() =>
//                                                         router.push(`/lecturer/classes/${s.offeringId}`)
//                                                     }
//                                                 >
//                                                     <div className="flex flex-col justify-center">
//                                                         <div className="flex flex-wrap items-center gap-2">
//                                                             <span className="font-semibold text-foreground text-lg">
//                                                                 {s.courseName}{" "}
//                                                                 <span className="text-muted-foreground text-sm">
//                                                                     ({s.classCode})
//                                                                 </span>
//                                                             </span>
//                                                             <Badge
//                                                                 variant="outline"
//                                                                 className={cn(
//                                                                     "px-2 py-0.5 text-xs font-medium rounded-full",
//                                                                     s.isPractice
//                                                                         ? "bg-orange-500/10 text-orange-600 border-orange-500/20"
//                                                                         : "bg-blue-500/10 text-blue-600 border-blue-500/20"
//                                                                 )}
//                                                             >
//                                                                 {s.isPractice ? "Thực hành" : "Lý thuyết"}
//                                                             </Badge>
//                                                             {s.isPractice && s.groupNumber && s.isMyPractice && (
//                                                                 <Badge className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
//                                                                     Nhóm {s.groupNumber}
//                                                                 </Badge>
//                                                             )}
//                                                         </div>

//                                                         <div className="flex items-center text-sm text-muted-foreground mt-1">
//                                                             <span>
//                                                                 {s.building}-{s.classroom} • Tiết {s.start_period} →{" "}
//                                                                 {s.start_period + s.period_count - 1}
//                                                             </span>
//                                                         </div>
//                                                     </div>

//                                                     <motion.div
//                                                         initial={{ opacity: 0 }}
//                                                         whileHover={{ opacity: 1 }}
//                                                         transition={{ duration: 0.2 }}
//                                                         className="flex items-center justify-center"
//                                                     >
//                                                         <ArrowRight className="w-5 h-5 text-muted-foreground" />
//                                                     </motion.div>
//                                                 </motion.div>
//                                             ))
//                                         )}
//                                     </CardContent>
//                                 </Card>
//                             </motion.div>

//                             {/* Lịch hẹn hôm nay */}
//                             <motion.div
//                                 className={cn("flex-1 w-full lg:w-1/2")}
//                                 initial={{ y: 10, opacity: 0 }}
//                                 animate={{ y: 0, opacity: 1 }}
//                                 transition={{ duration: 0.6, delay: 0.4 }}
//                             >
//                                 <Card className="shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-md transition-all">
//                                     <CardHeader>
//                                         <CardTitle>Lịch hẹn hôm nay</CardTitle>
//                                     </CardHeader>
//                                     <CardContent className="space-y-3">
//                                         {groupedAppointments.length === 0 ? (
//                                             <EmptyState
//                                                 icon={<CalendarDays className="w-10 h-10" />}
//                                                 text="Hôm nay không có lịch hẹn nào."
//                                             />
//                                         ) : (
//                                             groupedAppointments.map((a) => (
//                                                 <motion.div
//                                                     key={a.id + a.start_time}
//                                                     className="group p-4 border rounded-xl bg-background hover:bg-secondary/80 transition-all duration-200 space-y-2 cursor-pointer hover:shadow-md hover:border-primary/30"
//                                                     whileHover={{ scale: 1.02 }}
//                                                     onClick={() => router.push(`/lecturer/appointments`)}
//                                                 >
//                                                     <div className="flex justify-between items-center">
//                                                         <span className="font-semibold">{a.title}</span>
//                                                         <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
//                                                             {new Date(a.start_time).toLocaleTimeString("vi-VN", {
//                                                                 hour: "2-digit",
//                                                                 minute: "2-digit",
//                                                             })}{" "}
//                                                             -{" "}
//                                                             {new Date(a.end_time).toLocaleTimeString("vi-VN", {
//                                                                 hour: "2-digit",
//                                                                 minute: "2-digit",
//                                                             })}
//                                                         </Badge>
//                                                     </div>
//                                                     <p className="text-sm text-muted-foreground">
//                                                         Phụ huynh:{" "}
//                                                         <span className="font-medium text-foreground">
//                                                             {a.parents.join(", ")}
//                                                         </span>{" "}
//                                                         • Học sinh:{" "}
//                                                         <span className="font-medium text-foreground">
//                                                             {a.student.users.full_name}
//                                                         </span>
//                                                     </p>
//                                                     {a.location && (
//                                                         <p className="text-sm text-muted-foreground">
//                                                             Địa điểm: {a.location}
//                                                         </p>
//                                                     )}
//                                                 </motion.div>
//                                             ))
//                                         )}
//                                     </CardContent>
//                                 </Card>
//                             </motion.div>
//                         </div>
//                     </>
//                 )}
//             </div>
//         </motion.div>
//     );
// }

// V3 - KHÔNG bọc toàn bộ nội dung
// return (
//     <div className="py-1 px-6 sm:px-6 lg:px-8">
//         <div className="max-w-7xl mx-auto space-y-6">
//             {/* Header tối giản, đồng bộ */}
//             <motion.div
//                 className="rounded-2xl border bg-white p-6 sm:p-8 shadow-sm"
//                 initial={{ opacity: 0, y: -10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.4 }}
//             >
//                 <div className="flex flex-col gap-2">
//                     <h1 className="text-2xl sm:text-3xl font-semibold flex items-center gap-2 text-foreground">
//                         <BookText className="w-6 h-6 text-muted-foreground" />
//                         Bảng điều khiển Giảng viên
//                     </h1>
//                     {currentSemester && (
//                         <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
//                             <div className="flex items-center gap-2">
//                                 <CalendarDays className="w-4 h-4" />
//                                 <span className="font-medium text-foreground">{currentSemester.name}</span>
//                             </div>
//                             <span>•</span>
//                             <span>{currentSemester.academic_year}</span>
//                             <span>•</span>
//                             <span>
//                                 {weekdayMap[today.getDay()]}, {today.getDate()}/{today.getMonth() + 1}/{today.getFullYear()}
//                             </span>
//                         </div>
//                     )}
//                 </div>
//             </motion.div>

//             {loading ? (
//                 <div className="flex items-center justify-center h-[60vh]">
//                     <Loading text="Đang tải dữ liệu..." />
//                 </div>
//             ) : (
//                 <>
//                     {/* Stats Cards - Modern design */}
//                     <motion.div
//                         className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ duration: 0.5, delay: 0.1 }}
//                     >
//                         <motion.div
//                             className="h-full"
//                             whileHover={{ scale: 1.02, y: -4 }}
//                             transition={{ type: "spring", stiffness: 300 }}
//                         >
//                             <Card className="h-full group relative overflow-hidden border-2 border-blue-200/50 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300">
//                                 <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//                                 <CardContent className="p-6 relative min-h-[140px]">
//                                     <div className="flex items-center justify-between mb-4">
//                                         <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
//                                             <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
//                                         </div>
//                                     </div>
//                                     <div className="space-y-1">
//                                         <p className="text-sm font-medium text-muted-foreground">Lớp học phần hôm nay</p>
//                                         <p className="text-3xl font-bold text-foreground">{todaySchedules.length}</p>
//                                         <p className="text-xs text-muted-foreground">Tiết học trong ngày</p>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         </motion.div>

//                         <motion.div
//                             className="h-full"
//                             whileHover={{ scale: 1.02, y: -4 }}
//                             transition={{ type: "spring", stiffness: 300 }}
//                         >
//                             <Card className="h-full group relative overflow-hidden border-2 border-amber-200/50 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-300">
//                                 <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//                                 <CardContent className="p-6 relative min-h-[140px]">
//                                     <div className="flex items-center justify-between mb-4">
//                                         <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
//                                             <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
//                                         </div>
//                                     </div>
//                                     <div className="space-y-1">
//                                         <p className="text-sm font-medium text-muted-foreground">Lịch hẹn hôm nay</p>
//                                         <p className="text-3xl font-bold text-foreground">{appointments.length}</p>
//                                         <p className="text-xs text-muted-foreground">Cuộc hẹn đã lên lịch</p>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         </motion.div>

//                         <motion.div
//                             className="h-full"
//                             whileHover={{ scale: 1.02, y: -4 }}
//                             transition={{ type: "spring", stiffness: 300 }}
//                         >
//                             <Card className="h-full group relative overflow-hidden border-2 border-emerald-200/50 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300">
//                                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//                                 <CardContent className="p-6 relative min-h-[140px]">
//                                     <div className="flex items-center justify-between mb-4">
//                                         <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
//                                             <CalendarDays className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
//                                         </div>
//                                     </div>
//                                     <div className="space-y-1">
//                                         <p className="text-sm font-medium text-muted-foreground">Tổng lớp học phần</p>
//                                         <p className="text-3xl font-bold text-foreground">{offerings.length}</p>
//                                         <p className="text-xs text-muted-foreground">Trong học kỳ này</p>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         </motion.div>

//                         <motion.div
//                             className="h-full"
//                             whileHover={{ scale: 1.02, y: -4 }}
//                             transition={{ type: "spring", stiffness: 300 }}
//                         >
//                             <Card className="h-full group relative overflow-hidden border-2 border-purple-200/50 dark:border-purple-800/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300">
//                                 <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//                                 <CardContent className="p-6 relative min-h-[140px]">
//                                     <div className="flex items-center justify-between mb-4">
//                                         <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
//                                             <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
//                                         </div>
//                                     </div>
//                                     <div className="space-y-1">
//                                         <p className="text-sm font-medium text-muted-foreground">Học kỳ</p>
//                                         <p className="text-lg font-bold text-foreground truncate">
//                                             {currentSemester?.name || "N/A"}
//                                         </p>
//                                         <p className="text-xs text-muted-foreground">{currentSemester?.academic_year || ""}</p>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         </motion.div>
//                     </motion.div>

//                     {/* Main Content Grid */}
//                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                         {/* Lịch học hôm nay */}
//                         <motion.div
//                             initial={{ opacity: 0, x: -20 }}
//                             animate={{ opacity: 1, x: 0 }}
//                             transition={{ duration: 0.5, delay: 0.2 }}
//                         >
//                             <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300">
//                                 <CardHeader className="border-b border-border/40 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 flex items-center min-h-[56px]">

//                                     <div className="flex items-center justify-between w-full pb-4">
//                                         <CardTitle className="flex items-center gap-2 text-lg">
//                                             <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
//                                                 <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
//                                             </div>
//                                             Lịch học hôm nay
//                                         </CardTitle>
//                                         <Badge variant="secondary" className="text-xs">
//                                             {todaySchedules.length} tiết
//                                         </Badge>
//                                     </div>
//                                 </CardHeader>
//                                 <CardContent className="p-4 space-y-3">
//                                     {todaySchedules.length === 0 ? (
//                                         <EmptyState
//                                             icon={<Calendar className="w-12 h-12 text-muted-foreground/50" />}
//                                             text="Hôm nay không có lịch học nào."
//                                         />
//                                     ) : (
//                                         todaySchedules.map((s, i) => (
//                                             <motion.div
//                                                 key={i}
//                                                 initial={{ opacity: 0, y: 10 }}
//                                                 animate={{ opacity: 1, y: 0 }}
//                                                 transition={{ delay: i * 0.1 }}
//                                                 className="group p-4 rounded-xl border-2 border-border/50 hover:border-primary/50 bg-card hover:bg-accent/50 transition-all duration-200 ease-out cursor-pointer"
//                                                 whileHover={{ 
//                                                     scale: 1.01, 
//                                                     x: 4,
//                                                     transition: {
//                                                         type: "spring",
//                                                         stiffness: 500,
//                                                         damping: 18,
//                                                         duration: 0.15
//                                                     }
//                                                 }}
//                                                 onClick={() => router.push(`/lecturer/classes/${s.offeringId}`)}
//                                             >
//                                                 <div className="flex items-start justify-between gap-4">
//                                                     <div className="flex-1 space-y-2">
//                                                         <div className="flex flex-wrap items-center gap-2">
//                                                             <span className="font-semibold text-base text-foreground">
//                                                                 {s.courseName}
//                                                             </span>
//                                                             <Badge
//                                                                 variant="outline"
//                                                                 className={cn(
//                                                                     "text-xs font-medium",
//                                                                     s.isPractice
//                                                                         ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800"
//                                                                         : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
//                                                                 )}
//                                                             >
//                                                                 {s.isPractice ? "Thực hành" : "Lý thuyết"}
//                                                             </Badge>
//                                                             {s.isPractice && s.groupNumber && s.isMyPractice && (
//                                                                 <Badge className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
//                                                                     Nhóm {s.groupNumber}
//                                                                 </Badge>
//                                                             )}
//                                                         </div>
//                                                         <div className="flex items-center gap-3 text-sm text-muted-foreground">
//                                                             <span className="font-medium">{s.classCode}</span>
//                                                             <span>•</span>
//                                                             <span>{s.building}-{s.classroom}</span>
//                                                             <span>•</span>
//                                                             <span className="font-medium">Tiết {s.start_period}-{s.start_period + s.period_count - 1}</span>
//                                                         </div>
//                                                     </div>
//                                                     <motion.div
//                                                         initial={{ opacity: 0.5, x: -4 }}
//                                                         whileHover={{ 
//                                                             opacity: 1, 
//                                                             x: 0,
//                                                             transition: {
//                                                                 type: "spring",
//                                                                 stiffness: 600,
//                                                                 damping: 15,
//                                                                 duration: 0.1
//                                                             }
//                                                         }}
//                                                         className="flex-shrink-0"
//                                                     >
//                                                         <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200 ease-out" />
//                                                     </motion.div>
//                                                 </div>
//                                             </motion.div>
//                                         ))
//                                     )}
//                                 </CardContent>
//                             </Card>
//                         </motion.div>

//                         {/* Lịch hẹn hôm nay */}
//                         <motion.div
//                             initial={{ opacity: 0, x: 20 }}
//                             animate={{ opacity: 1, x: 0 }}
//                             transition={{ duration: 0.5, delay: 0.3 }}
//                         >
//                             <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300">
//                                 <CardHeader className="border-b border-border/40 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20 flex items-center">
//                                     <div className="flex items-center justify-between w-full pb-4">
//                                         <CardTitle className="flex items-center gap-2 text-lg">
//                                             <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
//                                                 <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
//                                             </div>
//                                             Lịch hẹn hôm nay
//                                         </CardTitle>
//                                         <Badge variant="secondary" className="text-xs">
//                                             {groupedAppointments.length} cuộc hẹn
//                                         </Badge>
//                                     </div>
//                                 </CardHeader>
//                                 <CardContent className="p-4 space-y-3">
//                                     {groupedAppointments.length === 0 ? (
//                                         <EmptyState
//                                             icon={<CalendarDays className="w-12 h-12 text-muted-foreground/50" />}
//                                             text="Hôm nay không có lịch hẹn nào."
//                                         />
//                                     ) : (
//                                         groupedAppointments.map((a, idx) => (
//                                             <motion.div
//                                                 key={a.id + a.start_time}
//                                                 initial={{ opacity: 0, y: 10 }}
//                                                 animate={{ opacity: 1, y: 0 }}
//                                                 transition={{ delay: idx * 0.1 }}
//                                                 className="group p-4 rounded-xl border-2 border-border/50 hover:border-primary/50 bg-card hover:bg-accent/50 transition-all duration-300 cursor-pointer"
//                                                 whileHover={{ scale: 1.01, x: 4 }}
//                                                 onClick={() => router.push(`/lecturer/appointments`)}
//                                             >
//                                                 <div className="space-y-3">
//                                                     <div className="flex items-start justify-between gap-3">
//                                                         <h3 className="font-semibold text-base text-foreground flex-1">{a.title}</h3>
//                                                         <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800 text-xs font-medium">
//                                                             {new Date(a.start_time).toLocaleTimeString("vi-VN", {
//                                                                 hour: "2-digit",
//                                                                 minute: "2-digit",
//                                                             })}{" "}
//                                                             -{" "}
//                                                             {new Date(a.end_time).toLocaleTimeString("vi-VN", {
//                                                                 hour: "2-digit",
//                                                                 minute: "2-digit",
//                                                             })}
//                                                         </Badge>
//                                                     </div>
//                                                     <div className="space-y-1.5 text-sm">
//                                                         <div className="flex items-center gap-2 text-muted-foreground">
//                                                             <span className="font-medium text-foreground">Phụ huynh:</span>
//                                                             <span>{a.parents.join(", ")}</span>
//                                                         </div>
//                                                         <div className="flex items-center gap-2 text-muted-foreground">
//                                                             <span className="font-medium text-foreground">Học sinh:</span>
//                                                             <span>{a.student.users.full_name}</span>
//                                                         </div>
//                                                         {a.location && (
//                                                             <div className="flex items-center gap-2 text-muted-foreground">
//                                                                 <span className="font-medium text-foreground">Địa điểm:</span>
//                                                                 <span>{a.location}</span>
//                                                             </div>
//                                                         )}
//                                                     </div>
//                                                 </div>
//                                             </motion.div>
//                                         ))
//                                     )}
//                                 </CardContent>
//                             </Card>
//                         </motion.div>
//                     </div>
//                 </>
//             )}
//         </div>
//     </div>
// );
// }


// V4 - Bọc toàn bộ nội dung
return (
    <div className="py-1 px-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
            {/* Card bọc toàn bộ nội dung */}
            <motion.div
                className="rounded-2xl border bg-white p-6 sm:p-8 shadow-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Header */}
                <div className="flex flex-col gap-2 mb-6">
                    <h1 className="text-2xl sm:text-3xl font-semibold flex items-center gap-2 text-foreground">
                        <BookText className="w-6 h-6 text-muted-foreground" />
                        Bảng điều khiển Giảng viên
                    </h1>
                    {currentSemester && (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                <span className="font-medium text-foreground">{currentSemester.name}</span>
                            </div>
                            <span>•</span>
                            <span>{currentSemester.academic_year}</span>
                            <span>•</span>
                            <span>
                                {weekdayMap[today.getDay()]}, {today.getDate()}/{today.getMonth() + 1}/{today.getFullYear()}
                            </span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <Loading text="Đang tải dữ liệu..." />
                    </div>
                ) : (
                    <div className="space-y-6">
                    {/* Stats Cards - Modern design */}
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <motion.div
                            className="h-full"
                            whileHover={{ scale: 1.02, y: -4 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Card className="h-full group relative overflow-hidden border-2 border-blue-200/50 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <CardContent className="p-6 relative min-h-[140px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                                            <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Lớp học phần hôm nay</p>
                                        <p className="text-3xl font-bold text-foreground">{todaySchedules.length}</p>
                                        <p className="text-xs text-muted-foreground">Tiết học trong ngày</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            className="h-full"
                            whileHover={{ scale: 1.02, y: -4 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Card className="h-full group relative overflow-hidden border-2 border-amber-200/50 dark:border-amber-800/50 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <CardContent className="p-6 relative min-h-[140px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                                            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Lịch hẹn hôm nay</p>
                                        <p className="text-3xl font-bold text-foreground">{appointments.length}</p>
                                        <p className="text-xs text-muted-foreground">Cuộc hẹn đã lên lịch</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            className="h-full"
                            whileHover={{ scale: 1.02, y: -4 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Card className="h-full group relative overflow-hidden border-2 border-emerald-200/50 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <CardContent className="p-6 relative min-h-[140px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                                            <CalendarDays className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Tổng lớp học phần</p>
                                        <p className="text-3xl font-bold text-foreground">{offerings.length}</p>
                                        <p className="text-xs text-muted-foreground">Trong học kỳ này</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            className="h-full"
                            whileHover={{ scale: 1.02, y: -4 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Card className="h-full group relative overflow-hidden border-2 border-purple-200/50 dark:border-purple-800/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <CardContent className="p-6 relative min-h-[140px]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                                            <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Học kỳ</p>
                                        <p className="text-lg font-bold text-foreground truncate">
                                            {currentSemester?.name || "N/A"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{currentSemester?.academic_year || ""}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </motion.div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Lịch học hôm nay */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardHeader className="border-b border-border/40 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 flex items-center min-h-[56px]">

                                    <div className="flex items-center justify-between w-full pb-4">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            Lịch học hôm nay
                                        </CardTitle>
                                        <Badge variant="secondary" className="text-xs">
                                            {todaySchedules.length} tiết
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    {todaySchedules.length === 0 ? (
                                        <EmptyState
                                            icon={<Calendar className="w-12 h-12 text-muted-foreground/50" />}
                                            text="Hôm nay không có lịch học nào."
                                        />
                                    ) : (
                                        todaySchedules.map((s, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="group p-4 rounded-xl border-2 border-border/50 hover:border-primary/50 bg-card hover:bg-accent/50 transition-all duration-200 ease-out cursor-pointer"
                                                whileHover={{ 
                                                    scale: 1.01, 
                                                    x: 4,
                                                    transition: {
                                                        type: "spring",
                                                        stiffness: 500,
                                                        damping: 18,
                                                        duration: 0.15
                                                    }
                                                }}
                                                onClick={() => router.push(`/lecturer/classes/${s.offeringId}`)}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-semibold text-base text-foreground">
                                                                {s.courseName}
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "text-xs font-medium",
                                                                    s.isPractice
                                                                        ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800"
                                                                        : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800"
                                                                )}
                                                            >
                                                                {s.isPractice ? "Thực hành" : "Lý thuyết"}
                                                            </Badge>
                                                            {s.isPractice && s.groupNumber && s.isMyPractice && (
                                                                <Badge className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                                                                    Nhóm {s.groupNumber}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                            <span className="font-medium">{s.classCode}</span>
                                                            <span>•</span>
                                                            <span>{s.building}-{s.classroom}</span>
                                                            <span>•</span>
                                                            <span className="font-medium">Tiết {s.start_period}-{s.start_period + s.period_count - 1}</span>
                                                        </div>
                                                    </div>
                                                    <motion.div
                                                        initial={{ opacity: 0.5, x: -4 }}
                                                        whileHover={{ 
                                                            opacity: 1, 
                                                            x: 0,
                                                            transition: {
                                                                type: "spring",
                                                                stiffness: 600,
                                                                damping: 15,
                                                                duration: 0.1
                                                            }
                                                        }}
                                                        className="flex-shrink-0"
                                                    >
                                                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors duration-200 ease-out" />
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Lịch hẹn hôm nay */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Card className="h-full shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardHeader className="border-b border-border/40 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20 flex items-center">
                                    <div className="flex items-center justify-between w-full pb-4">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                                                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            Lịch hẹn hôm nay
                                        </CardTitle>
                                        <Badge variant="secondary" className="text-xs">
                                            {groupedAppointments.length} cuộc hẹn
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 space-y-3">
                                    {groupedAppointments.length === 0 ? (
                                        <EmptyState
                                            icon={<CalendarDays className="w-12 h-12 text-muted-foreground/50" />}
                                            text="Hôm nay không có lịch hẹn nào."
                                        />
                                    ) : (
                                        groupedAppointments.map((a, idx) => (
                                            <motion.div
                                                key={a.id + a.start_time}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="group p-4 rounded-xl border-2 border-border/50 hover:border-primary/50 bg-card hover:bg-accent/50 transition-all duration-300 cursor-pointer"
                                                whileHover={{ scale: 1.01, x: 4 }}
                                                onClick={() => router.push(`/lecturer/appointments`)}
                                            >
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <h3 className="font-semibold text-base text-foreground flex-1">{a.title}</h3>
                                                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800 text-xs font-medium">
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
                                                    <div className="space-y-1.5 text-sm">
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <span className="font-medium text-foreground">Phụ huynh:</span>
                                                            <span>{a.parents.join(", ")}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <span className="font-medium text-foreground">Học sinh:</span>
                                                            <span>{a.student.users.full_name}</span>
                                                        </div>
                                                        {a.location && (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <span className="font-medium text-foreground">Địa điểm:</span>
                                                                <span>{a.location}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                    </div>
                )}
            </motion.div>
        </div>
    </div>
);
}

