"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
    CalendarDays,
    Users,
    BookOpen,
    UserRound,
    Activity,
    GraduationCap,
    Layers,
    CalendarClock,
    IdCard,
    BarChart3,
    Award,
    CheckCircle2,
    StickyNote,
    Info,
    CircleCheck,
    CircleX,
} from "lucide-react"
import { StudentDetailData } from "@packages/core/entities/Student";
import EmptyState from "@/components/empty-state"
import { AcademicStatusBadge, TrainingLevelBadge, TrainingTypeBadge } from "./student-badges"
import { PageBreadcrumb } from "@/components/page-breadcrumb"

export default function StudentDetail() {
    const { studentId, id } = useParams()
    const [data, setData] = useState<StudentDetailData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStudent() {
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/offerings/student/detail?offering_id=${id}&student_id=${studentId}`,
                    { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
                )

                const json = await res.json()
                if (json?.data) setData(json.data)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }

        if (studentId && id) fetchStudent()
    }, [studentId, id])

    const formatDate = (value?: string | null) => {
        if (!value) return "Chưa cập nhật"
        const date = new Date(value)
        return Number.isNaN(date.getTime()) ? "Chưa cập nhật" : date.toLocaleDateString("vi-VN")
    }

    const LoadingSkeleton = () => (
        <div className="space-y-8">
            <Card className="rounded-3xl border border-border/60 bg-card/70 p-6 sm:p-8 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.65)] backdrop-blur">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-2xl" />
                            <div className="space-y-3">
                                <Skeleton className="h-8 w-48 rounded-full" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-6 w-28 rounded-full" />
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-4 w-36" />
                        </div>
                    </div>
                    <Separator className="bg-border/60" />
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div
                                key={`summary-skeleton-${index}`}
                                className="rounded-2xl border border-border/50 bg-muted/20 p-4 shadow-inner shadow-black/5"
                            >
                                <Skeleton className="h-4 w-24 rounded-full" />
                                <Skeleton className="mt-4 h-6 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {Array.from({ length: 2 }).map((_, index) => (
                <Card
                    key={`content-skeleton-${index}`}
                    className="rounded-3xl border border-border/60 bg-card/70 p-6 sm:p-8 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.65)] backdrop-blur"
                >
                    <div className="space-y-6">
                        <Skeleton className="h-6 w-40 rounded-full" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                    </div>
                </Card>
            ))}
        </div>
    )

    let content = null

    if (data) {
        const {
            student,
            parents,
            grades,
            offering,
            practice_groups,
            class: classInfo,
            semester,
        } = data

        const infoItems = [
            {
                label: "Ngày sinh",
                value: formatDate(student.date_of_birth),
            },
            {
                label: "Nơi sinh",
                value: student.place_of_birth || "Chưa cập nhật",
            },
            {
                label: "Địa chỉ",
                value: student.contact_address || "Chưa cập nhật",
            },
            {
                label: "Email",
                value: student.email || "Chưa cập nhật",
            },
            {
                label: "Số điện thoại",
                value: student.phone || "Chưa cập nhật",
            },
            {
                label: "CMND/CCCD",
                value: student.citizen_id_card || "Chưa cập nhật",
            },
            {
                label: "Dân tộc",
                value: student.ethnic || "Chưa cập nhật",
            },

            {
                label: "Năm học",
                value: student.academic_year || "Chưa cập nhật",
            },

        ]

        const regularScores = grades?.theoryScores?.filter((g) => g.type === "regular") ?? []

        content = (
            <div className="space-y-8">
                <Card className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/70 p-6 sm:p-8 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.65)] backdrop-blur">
                    <CardContent className="p-0 space-y-6">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner shadow-primary/20">
                                    <UserRound className="h-8 w-8" />
                                </span>
                                <div>
                                    <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
                                        {student.full_name}
                                    </h2>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <Badge className="border border-primary/40 bg-primary/10 text-primary">
                                            MS: {student.student_code}
                                        </Badge>
                                        {classInfo?.class_code && (
                                            <Badge className="border border-border/40 bg-background/70 text-muted-foreground">
                                                Lớp: {classInfo.class_code}
                                            </Badge>
                                        )}
                                        {practice_groups && (
                                            <Badge className="border border-emerald-400/40 bg-emerald-500/10 text-emerald-600">
                                                Nhóm TH {practice_groups.group_number}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm font-medium text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                    <span>
                                        Học phần:{" "}
                                        <span className="text-foreground">
                                            {offering?.name ?? "Chưa cập nhật"}
                                        </span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span>
                                        Nhóm thực hành:{" "}
                                        <span className="text-foreground">
                                            {practice_groups?.group_number
                                                ? `Nhóm ${practice_groups.group_number}`
                                                : "Chưa cập nhật"}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-border/60" />

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 shadow-inner shadow-black/5">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Trạng thái học tập
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    <AcademicStatusBadge status={student.academic_status} />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 shadow-inner shadow-black/5">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Loại hình đào tạo
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-primary" />
                                    <TrainingTypeBadge type={student.type_of_tranning} />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 shadow-inner shadow-black/5">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Trình độ đào tạo
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    <TrainingLevelBadge level={student.training_level} />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 shadow-inner shadow-black/5">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Khóa học
                                </p>
                                <div className="mt-3 flex items-center gap-2 text-foreground">
                                    <CalendarClock className="h-5 w-5 text-primary" />
                                    <span className="font-semibold">
                                        {student.academic_year || "Chưa cập nhật"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border border-border/60 bg-background/70 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
                    <CardHeader className="gap-3 pb-0">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                                <IdCard className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    Hồ sơ cá nhân
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Thông tin chi tiết về sinh viên và chương trình đào tạo
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="mt-6">
                        <div className="flex flex-col gap-3">
                            {infoItems.map(({ label, value }) => (
                                <div
                                    key={label}
                                    className="rounded-2xl border border-border/40 bg-muted/10 px-5 py-4 text-sm shadow-sm transition-all hover:border-border/60 hover:shadow-md"
                                >
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {label}
                                    </p>
                                    <p className="mt-2 text-base font-medium leading-relaxed text-foreground">
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border border-border/60 bg-background/70 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
                    <CardHeader className="gap-3 pb-0">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                                <Users className="h-5 w-5" />
                            </span>
                            <div className="flex items-center gap-3">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-foreground">
                                        Thông tin phụ huynh
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Danh sách phụ huynh và thông tin liên hệ
                                    </p>
                                </div>
                                <Badge className="ml-auto border border-border/40 bg-background/70 text-muted-foreground">
                                    {parents.length} người
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="mt-6 space-y-4">
                        {parents.length === 0 ? (
                            <EmptyState
                                icon={<Info className="h-10 w-10" />}
                                text="Chưa có thông tin phụ huynh."
                                className="rounded-2xl border border-dashed border-border/60 bg-muted/20"
                            />
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-border/40 bg-background/80 shadow-inner shadow-black/5">
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Quan hệ
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Họ tên
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Số điện thoại
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Email
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Nghề nghiệp
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parents.map((p, i) => (
                                            <TableRow
                                                key={`${p.relation}-${i}`}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <TableCell className="font-medium text-foreground">
                                                    {p.relation === "father"
                                                        ? "Cha"
                                                        : p.relation === "mother"
                                                            ? "Mẹ"
                                                            : "Phụ huynh"}
                                                </TableCell>
                                                <TableCell>{p.name || "Chưa cập nhật"}</TableCell>
                                                <TableCell>{p.phone || "Chưa cập nhật"}</TableCell>
                                                <TableCell>{p.email || "Chưa cập nhật"}</TableCell>
                                                <TableCell>{p.occupation || "Chưa cập nhật"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border border-border/60 bg-background/70 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
                    <CardHeader className="gap-3 pb-0">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                                <BarChart3 className="h-5 w-5" />
                            </span>
                            <div>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    Bảng điểm chi tiết
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Tổng hợp điểm quá trình, thực hành và kết quả cuối kỳ
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="mt-6 space-y-6">
                        {grades?.summary && (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm shadow-inner shadow-primary/20">
                                    <div className="flex items-center gap-2 text-primary">
                                        <BarChart3 className="h-4 w-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wide">
                                            Điểm tổng kết
                                        </span>
                                    </div>
                                    <p className="mt-3 text-2xl font-semibold text-foreground">
                                        {grades.summary.total_score ?? "-"}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm shadow-inner shadow-amber-500/30">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <Award className="h-4 w-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wide">
                                            Điểm chữ
                                        </span>
                                    </div>
                                    <p className="mt-3 text-2xl font-semibold text-foreground">
                                        {grades.summary.letter_grade ?? "-"}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm shadow-inner shadow-emerald-500/20">
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wide">
                                            Kết quả
                                        </span>
                                    </div>
                                    <p className="mt-3 text-2xl font-semibold text-foreground">
                                        {grades.summary.passed === true
                                            ? "Đạt"
                                            : grades.summary.passed === false
                                                ? "Không đạt"
                                                : "-"}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm shadow-inner shadow-black/5">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <StickyNote className="h-4 w-4" />
                                        <span className="text-xs font-semibold uppercase tracking-wide">
                                            Ghi chú
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">
                                        {grades.summary.note || "Không có"}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto rounded-2xl border border-border/40 bg-background/80 shadow-inner shadow-black/5">
                            <Table className="min-w-[800px]">
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead colSpan={9} className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Thường xuyên
                                        </TableHead>
                                        <TableHead colSpan={5} className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Thực hành
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Giữa kỳ
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Cuối kỳ
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Tổng kết
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Thang 4
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Điểm chữ
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Xếp loại
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Đạt
                                        </TableHead>
                                        <TableHead rowSpan={2} className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Ghi chú
                                        </TableHead>
                                    </TableRow>
                                    <TableRow className="bg-muted/30">
                                        {Array.from({ length: 9 }, (_, i) => (
                                            <TableHead key={`ts-${i}`} className="text-center text-xs font-semibold text-muted-foreground">
                                                {i + 1}
                                            </TableHead>
                                        ))}
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <TableHead key={`th-${i}`} className="text-center text-xs font-semibold text-muted-foreground">
                                                {i + 1}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    <TableRow className="text-sm transition-colors hover:bg-muted/30">
                                        {Array.from({ length: 9 }, (_, i) => (
                                            <TableCell key={`regular-${i}`} className="text-center font-medium text-foreground">
                                                {regularScores[i]?.score ?? "-"}
                                            </TableCell>
                                        ))}
                                        {Array.from({ length: 5 }, (_, i) => (
                                            <TableCell key={`practice-${i}`} className="text-center font-medium text-foreground">
                                                {grades?.practiceScores?.[i]?.score ?? "-"}
                                            </TableCell>
                                        ))}
                                        <TableCell className="text-center font-medium text-foreground">
                                            {grades?.theoryScores?.find((g) => g.type === "midterm")?.score ?? "-"}
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-foreground">
                                            {grades?.theoryScores?.find((g) => g.type === "final")?.score ?? "-"}
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-foreground">
                                            {grades?.summary?.total_score ?? "-"}
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-foreground">
                                            {grades?.summary?.gpa4 ?? "-"}
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-foreground">
                                            {grades?.summary?.letter_grade ?? "-"}
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-foreground">
                                            {grades?.summary?.classification ?? "-"}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {grades?.summary?.passed === true ? (
                                                <CircleCheck className="mx-auto h-4 w-4 text-emerald-500" />
                                            ) : grades?.summary?.passed === false ? (
                                                <CircleX className="mx-auto h-4 w-4 text-red-500" />
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-foreground">
                                            {grades?.summary?.note ?? "-"}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)]" />
            <div className="space-y-8 rounded-3xl border border-border/60 bg-background/50 p-6 sm:p-10 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.6)] backdrop-blur-xl">
                <PageBreadcrumb
                    items={[
                        { label: "Lớp học phần", href: "/lecturer/classes" },
                        data?.offering?.name && data?.practice_groups
                            ? {
                                label: `${data.offering.name} - Nhóm TH ${data.practice_groups.group_number}`,
                                href: `/lecturer/classes/${id}`,
                            }
                            : { label: "Chi tiết lớp học phần", href: `/lecturer/classes/${id}` },
                        { label: "Thông tin sinh viên" },
                    ]}
                />

                {loading ? (
                    <LoadingSkeleton />
                ) : !data ? (
                    <Card className="rounded-3xl border border-destructive/50 bg-destructive/10 p-6 shadow-[0_24px_80px_-50px_rgba(239,68,68,0.45)]">
                        <CardContent className="flex flex-col items-center gap-4 p-0 py-6 text-destructive">
                            <Info className="h-10 w-10" />
                            <p className="text-base font-medium">Không tìm thấy thông tin sinh viên.</p>
                        </CardContent>
                    </Card>
                ) : (
                    content
                )}
            </div>
        </div>
    )
}
