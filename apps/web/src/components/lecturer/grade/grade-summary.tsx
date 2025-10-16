"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Student } from "@packages/core/entities/Student";
import { Enrollment } from "@packages/core/entities/Enrollment";
import { PracticeGroup } from "@packages/core/entities/PracticeGroup";
import { Offering } from "@packages/core/entities/CourseOffering";
import { GradeTableCard } from "../classes/grade-table-card";
import { toast } from "sonner";
import { BookText, Loader2 } from "lucide-react";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import EmptyState from "@/components/empty-state";
import { GradeDistributionChart } from "./grade-distribution-chart";
import { GradeSummaryStats } from "./grade-summary-stats";
import { GradePassPieChart } from "./grade-pass-pie-chart";

export default function GradeSummary() {
    const params = useParams();
    const { id } = params;

    const [offering, setOffering] = useState<Offering | null>(null);
    const [loading, setLoading] = useState(true);
    const [gradesData, setGradesData] = useState<any[]>([]);
    const [loadingGrades, setLoadingGrades] = useState(false);

    const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
    const currentLecturerId = currentUser?.id;
    const isTheoryLecturer = offering?.lecturers?.id === currentLecturerId;

    const myPracticeGroup = offering?.practice_groups?.find(
        (g) => g.lecturers?.id === currentLecturerId
    );

    useEffect(() => {
        if (!id) return;

        const fetchDetail = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    toast.error("Bạn chưa đăng nhập.");
                    setOffering(null);
                    setLoading(false);
                    return;
                }
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/course-offerings/${id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const json = await res.json();
                setOffering(json.returnCode === 0 ? json.data : null);
            } catch (error) {
                console.error("Error fetching class detail:", error);
                setOffering(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const fetchGrades = async () => {
            setLoadingGrades(true);
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/grades/lecturer?offering_id=${id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const json = await res.json();
                if (json.returnCode === 0) {
                    let data = json.data;

                    if (!isTheoryLecturer && myPracticeGroup) {
                        data = data.filter(
                            (g: any) => g.practice_group_number === myPracticeGroup.group_number
                        );
                    }

                    setGradesData(data);
                } else {
                    console.warn("Không lấy được điểm:", json.message);
                }
            } catch (error) {
                console.error("Error fetching grades:", error);
            } finally {
                setLoadingGrades(false);
            }
        };
        fetchGrades();
    }, [id, isTheoryLecturer, myPracticeGroup]);

    if (loading) return (
        <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Đang tải danh sách điểm của lớp học phần...
        </div>
    );
    if (!offering)
        return (
            <EmptyState
                icon={<BookText className="w-10 h-10" />}
                text="Không có lớp học phần nào được tìm thấy."
                className="py-1"
            />
        );

    return (
        <div className="space-y-10">
            <PageBreadcrumb
                items={[
                    { label: "Lớp học phần", href: "/lecturer/classes" },
                    { label: offering.name, href: `/lecturer/classes/${offering.id}` },
                    { label: "Bảng điểm lớp học phần" },
                ]}
            />
            <section>
                <h3 className="text-lg font-semibold mb-4">Bảng điểm chi tiết của lớp học phần</h3>
                <GradeTableCard grades={gradesData} offeringName={offering.name} />
                <GradeSummaryStats grades={gradesData} />
                <GradeDistributionChart grades={gradesData} />
                <GradePassPieChart grades={gradesData} />
            </section>
        </div>
    );
}
