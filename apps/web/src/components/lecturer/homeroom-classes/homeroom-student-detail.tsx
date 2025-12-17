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
    UserRound,
    Activity,
    GraduationCap,
    Layers,
    CalendarClock,
    IdCard,
    Info,
} from "lucide-react"
import EmptyState from "@/components/empty-state"
import { PageBreadcrumb } from "@/components/page-breadcrumb"
import {
    AcademicStatusBadge,
    TrainingLevelBadge,
    TrainingTypeBadge,
} from "../classes/student-badges"
import { StudentDetailDataForClass } from "@packages/core/entities/Student"

export default function HomeroomStudentDetail() {
    const { studentId, id } = useParams()
    const [data, setData] = useState<StudentDetailDataForClass | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!studentId || !id) return

        const fetchStudent = async () => {
            try {
                const token = localStorage.getItem("token")
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/classes/homeroom/student/detail?class_id=${id}&student_id=${studentId}`,
                    {
                        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                    }
                )

                const json = await res.json()
                if (json?.data) setData(json.data)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }

        fetchStudent()
    }, [studentId, id])

    const formatDate = (value?: string | null) => {
        if (!value) return "Chưa cập nhật"
        const date = new Date(value)
        return isNaN(date.getTime()) ? "Chưa cập nhật" : date.toLocaleDateString("vi-VN")
    }

    const LoadingSkeleton = () => (
        <div className="space-y-8">
            <Card className="rounded-3xl border border-border/60 bg-card/70 p-6 sm:p-8 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.65)] backdrop-blur">
                <div className="flex flex-col gap-6">
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
                    <Separator className="bg-border/60" />
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    )

    if (loading) return <LoadingSkeleton />

    if (!data) {
        return (
            <Card className="rounded-3xl border border-destructive/50 bg-destructive/10 p-6">
                <CardContent className="flex flex-col items-center gap-4 text-destructive">
                    <Info className="h-10 w-10" />
                    <p>Không tìm thấy thông tin sinh viên.</p>
                </CardContent>
            </Card>
        )
    }

    const infoItems = [
        { label: "Ngày sinh", value: formatDate(data.date_of_birth) },
        { label: "Nơi sinh", value: data.place_of_birth || "Chưa cập nhật" },
        { label: "Địa chỉ", value: data.contact_address || "Chưa cập nhật" },
        { label: "Email", value: data.user.email || "Chưa cập nhật" },
        { label: "Số điện thoại", value: data.user.phone || "Chưa cập nhật" },
        { label: "Năm học", value: data.academic_year },
    ]

    return (
        <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)]" />
            <div className="space-y-8 rounded-3xl border border-border/60 bg-background/50 p-6 sm:p-10 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.6)] backdrop-blur-xl">
                <PageBreadcrumb
                    items={[
                        { label: "Lớp chủ nhiệm", href: "/lecturer/homeroom-classes" },
                        {label: "Lớp " + data.class, href: `/lecturer/homeroom-classes/${id}` },
                        { label: "Thông tin sinh viên" },
                    ]}
                />

                <Card className="rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/70 p-6 sm:p-8 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.65)] backdrop-blur">
                    <CardContent className="p-0 space-y-6">
                        <div className="flex items-start gap-4">
                            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                                <UserRound className="h-8 w-8" />
                            </span>
                            <div>
                                <h2 className="text-2xl font-semibold md:text-3xl">
                                    {data.user.full_name}
                                </h2>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Badge className="border border-primary/40 bg-primary/10 text-primary">
                                        MS: {data.student_code}
                                    </Badge>
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
                                    <AcademicStatusBadge status={data.academic_status} />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 shadow-inner shadow-black/5">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Loại hình đào tạo
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-primary" />
                                    <TrainingTypeBadge type={data.type_of_tranning} />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 shadow-inner shadow-black/5">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Trình độ đào tạo
                                </p>
                                <div className="mt-3 flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    <TrainingLevelBadge level={data.training_level} />
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-5 shadow-inner shadow-black/5">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Khóa học
                                </p>
                                <div className="mt-3 flex items-center gap-2 text-foreground">
                                    <CalendarClock className="h-5 w-5 text-primary" />
                                    <span className="font-semibold">
                                        {data.academic_year || "Chưa cập nhật"}
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
                    <CardContent className="mt-6 space-y-3">
                        {infoItems.map(({ label, value }) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-border/40 bg-muted/10 px-5 py-4 text-sm"
                            >
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {label}
                                </p>
                                <p className="mt-2 text-base font-medium text-foreground">
                                    {value}
                                </p>
                            </div>
                        ))}
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
                                    {data.parents.length} người
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="mt-6">
                        {data.parents.length === 0 ? (
                            <EmptyState
                                icon={<Info className="h-10 w-10" />}
                                text="Chưa có thông tin phụ huynh."
                                className="rounded-2xl border border-dashed border-border/60 bg-muted/20"
                            />
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Quan hệ</TableHead>
                                        <TableHead>Họ tên</TableHead>
                                        <TableHead>SĐT</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Nghề nghiệp</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.parents.map((p, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                {p.relationship === "father"
                                                    ? "Cha"
                                                    : p.relationship === "mother"
                                                        ? "Mẹ"
                                                        : "Phụ huynh"}
                                            </TableCell>
                                            <TableCell>{p.user.full_name}</TableCell>
                                            <TableCell>{p.user.phone || "-"}</TableCell>
                                            <TableCell>{p.user.email || "-"}</TableCell>
                                            <TableCell>{p.occupation || "-"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
