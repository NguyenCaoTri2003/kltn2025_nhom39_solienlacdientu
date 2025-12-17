"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { BookOpen, BookText, GraduationCap, Loader2 } from "lucide-react";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import EmptyState from "@/components/empty-state";
import { toast } from "sonner";

import { Class } from "@packages/core/entities/Classes";
import { Student } from "@packages/core/entities/Student";
import { StudentTable } from "../classes/student-table";

export default function HomeroomClassesDetail() {
    const { id } = useParams();

    const [classes, setClasses] = useState<Class | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [studentLoading, setStudentLoading] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchClass = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/classes/homeroom/detail?class_id=${id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const json = await res.json();

                if (json.returnCode !== 0) {
                    toast.error(json.message || "Không thể tải lớp học phần");
                    setClasses(null);
                    return;
                }

                setClasses(json.data);
            } catch (err) {
                console.error(err);
                toast.error("Lỗi khi tải lớp học phần");
            } finally {
                setLoading(false);
            }
        };

        fetchClass();
    }, [id]);

    useEffect(() => {
        if (!classes?.id) return;

        const fetchStudents = async () => {
            try {
                setStudentLoading(true);
                const token = localStorage.getItem("token");

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/classes/homeroom/student?class_id=${classes.id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const json = await res.json();
                setStudents(json.returnCode === 0 ? json.data : []);
            } catch (err) {
                console.error(err);
                setStudents([]);
            } finally {
                setStudentLoading(false);
            }
        };

        fetchStudents();
    }, [classes?.id]);

    if (loading) {
        return (
            <div className="relative">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
                <div className="rounded-3xl border border-border/60 bg-card/40 p-10 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Loader2 className="h-7 w-7 animate-spin" />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                        Đang tải thông tin chi tiết lớp chủ nhiệm...
                    </p>
                </div>
            </div>
        );
    }

    if (!classes) {
        return (
            <div className="relative">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
                <div className="rounded-3xl border border-border/60 bg-card/40 p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                    <EmptyState
                        icon={<BookText className="w-10 h-10" />}
                        text="Không có lớp chủ nhiệm nào được tìm thấy."
                        className="py-4"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">

            <PageBreadcrumb
                items={[
                    { label: "Lớp chủ nhiệm", href: "/lecturer/classes" },
                    { label: classes.name },
                ]}
            />

            <Card className="group relative overflow-hidden rounded-3xl border border-border/60
        bg-gradient-to-br from-card/95 via-card/90 to-background/60
        p-6 sm:p-8 shadow-[0_24px_80px_-40px_rgba(59,130,246,0.45)]">

                <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />

                <div className="relative flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                            <BookOpen className="h-7 w-7" />
                        </div>

                        <div className="flex-1 space-y-1">
                            <h2 className="text-2xl font-semibold text-foreground">
                                {classes.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Mã lớp:{" "}
                                <span className="font-medium text-foreground">
                                    {classes.class_code}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
                        <p>
                            <span className="font-medium text-foreground">Niên khóa:</span>{" "}
                            {classes.academic_year || "-"}
                        </p>

                        <p>
                            <span className="font-medium text-foreground">Loại lớp:</span>{" "}
                            {classes.class_type === "regular" ? "Chính quy" : "Tiên tiến"}
                        </p>

                        {classes.major && (
                            <p>
                                <span className="font-medium text-foreground">Ngành:</span>{" "}
                                {classes.major.name}
                            </p>
                        )}

                        {classes.major?.faculty && (
                            <p>
                                <span className="font-medium text-foreground">Khoa:</span>{" "}
                                {classes.major.faculty.name}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end border-t border-border/40 pt-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            {students.length} sinh viên
                        </span>
                    </div>
                </div>
            </Card>

            <section className="space-y-5">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                        Danh sách sinh viên
                    </h3>
                    <div className="rounded-full border border-border/50 bg-background/60 px-4 py-1 text-xs font-medium text-muted-foreground shadow-inner">
                        Tổng: {students.length} sinh viên
                    </div>
                </div>

                {studentLoading ? (
                    <div className="rounded-3xl border border-border/60 bg-background/70 p-6 text-center text-sm text-muted-foreground">
                        Đang tải danh sách sinh viên...
                    </div>
                ) : students.length === 0 ? (
                    <EmptyState
                        icon={<GraduationCap className="h-10 w-10" />}
                        text="Lớp hiện chưa có sinh viên."
                    />
                ) : (
                    <div className="rounded-3xl border border-border/60 bg-background/70 p-4 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.45)] backdrop-blur">
                        <StudentTable
                            classId={classes.id}
                            students={students}
                            practiceGroups={[]}
                            lecturerName={undefined}
                            className={classes.name}
                            mode="homeroom"
                        />
                    </div>
                )}
            </section>
        </div>
    );
}
