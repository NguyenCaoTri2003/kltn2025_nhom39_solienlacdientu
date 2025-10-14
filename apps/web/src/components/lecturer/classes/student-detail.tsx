"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CircleCheck, CircleX } from "lucide-react"
import { Parent } from "@packages/core/entities/Parent";
import { Grade } from "@packages/core/entities/Grade";
import { Student, StudentDetailData } from "@packages/core/entities/Student";
import { AcademicStatusBadge, TrainingLevelBadge, TrainingTypeBadge } from "./student-badges"
import { PageBreadcrumb } from "@/components/page-breadcrumb"

export default function StudentDetail() {
    const { studentId } = useParams()
    const { id } = useParams()
    const [data, setData] = useState<StudentDetailData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStudent() {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/offerings/student/detail?offering_id=${id}&student_id=${studentId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
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

    if (loading) return <p className="text-center mt-10">Đang tải dữ liệu...</p>
    if (!data) return <p className="text-center mt-10 text-destructive">Không tìm thấy sinh viên.</p>

    const { student, parents, grades, offering, practice_groups } = data

    return (
        <div className="space-y-8">
            <PageBreadcrumb
                items={[
                    { label: "Lớp học phần", href: "/lecturer/classes" },
                    { label: `${offering.name} - Nhóm thực hành ${practice_groups.group_number}` , href: `/lecturer/classes/${id}` },
                    { label: "Thông tin sinh viên" },
                ]}
            />
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Thông tin sinh viên</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Họ tên:</strong> {student.full_name}</div>
                        <div><strong>MSSV:</strong> {student.student_code}</div>
                        <div><strong>Ngày sinh:</strong> {new Date(student.date_of_birth).toLocaleDateString()}</div>
                        <div><strong>Nơi sinh:</strong> {student.place_of_birth}</div>
                        <div><strong>Địa chỉ:</strong> {student.contact_address}</div>
                        <div><strong>Lớp:</strong> {student.class}</div>
                        <div><strong>Số CMND/CCCD:</strong> {student.citizen_id_card || "-"}</div>
                        <div><strong>Dân tộc:</strong> {student.ethnic || "-"}</div>
                        <div><strong>Trạng thái học tập:</strong> <AcademicStatusBadge status={student.academic_status} /></div>
                        <div><strong>Loại hình đào tạo:</strong> <TrainingTypeBadge type={student.type_of_tranning} /></div>
                        <div><strong>Trình độ đào tạo:</strong> <TrainingLevelBadge level={student.training_level} /></div>
                        <div><strong>Năm học:</strong> {student.academic_year}</div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Phụ huynh</CardTitle>
                </CardHeader>
                <CardContent>
                    {parents.length === 0 ? (
                        <p>Không có thông tin phụ huynh.</p>
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
                                {parents.map((p, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{p.relation === "father"
                                            ? "Cha"
                                            : p.relation === "mother"
                                                ? "Mẹ"
                                                : "Phụ huynh"}
                                        </TableCell>
                                        <TableCell>{p.name}</TableCell>
                                        <TableCell>{p.phone}</TableCell>
                                        <TableCell>{p.email}</TableCell>
                                        <TableCell>{p.occupation}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle>Bảng điểm chi tiết</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto w-full">
                        <Table className="w-max min-w-full border-collapse border border-slate-300">
                            <TableHeader className="bg-slate-100 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead colSpan={9} className="text-center">Thường xuyên</TableHead>
                                    <TableHead colSpan={5} className="text-center">Thực hành</TableHead>
                                    <TableHead rowSpan={2}>Giữa kỳ</TableHead>
                                    <TableHead rowSpan={2}>Cuối kỳ</TableHead>
                                    <TableHead rowSpan={2}>Điểm tổng kết</TableHead>
                                    <TableHead rowSpan={2}>Thang điểm 4</TableHead>
                                    <TableHead rowSpan={2}>Điểm chữ</TableHead>
                                    <TableHead rowSpan={2}>Xếp loại</TableHead>
                                    <TableHead rowSpan={2}>Đạt</TableHead>
                                    <TableHead rowSpan={2}>Ghi chú</TableHead>
                                </TableRow>
                                <TableRow>
                                    {Array.from({ length: 9 }, (_, i) => (
                                        <TableHead key={`ts-${i}`} className="text-center">{i + 1}</TableHead>
                                    ))}
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <TableHead key={`th-${i}`} className="text-center">{i + 1}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>

                            <TableBody className="w-full">
                                <TableRow className="hover:bg-slate-50">
                                    {Array.from({ length: 9 }, (_, i) => (
                                        <TableCell key={i} className="text-center">
                                            {grades?.theoryScores?.filter(g => g.type === "regular")[i]?.score ?? "-"}
                                        </TableCell>
                                    ))}
                                    {Array.from({ length: 5 }, (_, i) => (
                                        <TableCell key={i} className="text-center">
                                            {grades?.practiceScores?.[i]?.score ?? "-"}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-center">
                                        {grades?.theoryScores?.find(g => g.type === "midterm")?.score ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {grades?.theoryScores?.find(g => g.type === "final")?.score ?? "-"}
                                    </TableCell>
                                    <TableCell className="text-center">{grades?.summary?.total_score ?? "-"}</TableCell>
                                    <TableCell className="text-center">{grades?.summary?.gpa4 ?? "-"}</TableCell>
                                    <TableCell className="text-center">{grades?.summary?.letter_grade ?? "-"}</TableCell>
                                    <TableCell className="text-center">{grades?.summary?.classification ?? "-"}</TableCell>
                                    <TableCell className="text-center">
                                        {grades?.summary?.passed === true ? (
                                            <CircleCheck className="mx-auto h-4 w-4 text-green-500" />
                                        ) : grades?.summary?.passed === false ? (
                                            <CircleX className="mx-auto h-4 w-4 text-red-500" />
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">{grades?.summary?.note ?? "-"}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
