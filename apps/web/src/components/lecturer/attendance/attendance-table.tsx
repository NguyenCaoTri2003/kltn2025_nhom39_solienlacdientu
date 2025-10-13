"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Info, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface AttendanceRecord {
    id: number;
    attendance_date: string;
    status: "present" | "absent" | "late" | "excused";
    note?: string;
    type: "theory" | "practice";
    practice_group_id?: number | null;
    enrollment: { student_id: number };
}

interface Student {
    id: number;
    studentCode: string;
    fullName: string;
}

interface Group {
    key: string;
    groupId?: number;
    dates: string[];
}

interface AttendanceTableProps {
    students: Student[];
    attendanceMap: Record<number, Record<string, AttendanceRecord[]>>;
    group: Group;
    currentPage: number;
    pageSize: number;
    selectedStudents: Set<number>;
    toggleSelectStudent: (id: number) => void;
    toggleSelectAll: (students: Student[]) => void;
    onOpenNote: (note?: string) => void;
    loading?: boolean;
}

export default function AttendanceTable({
    students,
    attendanceMap,
    group,
    currentPage,
    pageSize,
    selectedStudents,
    toggleSelectStudent,
    toggleSelectAll,
    onOpenNote,
    loading = false,
}: AttendanceTableProps) {
    const formatVNDate = (dateStr: string) =>
        format(parseISO(dateStr), "dd/MM/yyyy", { locale: vi });

    const getBadge = (status: AttendanceRecord["status"]) => {
        switch (status) {
            case "present":
                return (
                    <Badge className="bg-green-100 text-green-700 border border-green-200">
                        Có mặt
                    </Badge>
                );
            case "absent":
                return (
                    <Badge className="bg-red-100 text-red-700 border border-red-200">
                        Vắng
                    </Badge>
                );
            case "late":
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200">
                        Trễ
                    </Badge>
                );
            case "excused":
                return (
                    <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
                        Có phép
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-700 border border-gray-200">
                        -
                    </Badge>
                );
        }
    };

    const allSelected = students.length > 0 && students.every((s) => selectedStudents.has(s.id));

    return (
        <div className="relative">
            {/* Overlay loading spinner */}
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm z-10 rounded-md">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-600 mb-2" />
                    <p className="text-sm text-gray-600">Đang lưu điểm danh...</p>
                </div>
            )}

            <Table className={`mt-4 transition-opacity ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                <TableHeader>
                    <TableRow>
                        <TableHead className="sticky left-0 z-20">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={() => toggleSelectAll(students)}
                                disabled={loading}
                            />
                        </TableHead>
                        <TableHead>STT</TableHead>
                        <TableHead>MSSV</TableHead>
                        <TableHead>Họ và tên</TableHead>
                        {group.dates.map((d) => (
                            <TableHead key={d}>{formatVNDate(d)}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {students.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4 + group.dates.length} className="text-center">
                                Không có sinh viên nào
                            </TableCell>
                        </TableRow>
                    ) : (
                        students.map((s, idx) => (
                            <TableRow key={s.id}>
                                <TableCell className="sticky left-0 z-10">
                                    <Checkbox
                                        checked={selectedStudents.has(s.id)}
                                        onCheckedChange={() => toggleSelectStudent(s.id)}
                                        disabled={loading}
                                    />
                                </TableCell>
                                <TableCell>{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                                <TableCell>{s.studentCode}</TableCell>
                                <TableCell>{s.fullName}</TableCell>
                                {group.dates.map((date) => {
                                    const records = attendanceMap[s.id]?.[date] || [];
                                    const record = records.find((r) =>
                                        group.key === "theory"
                                            ? r.type === "theory"
                                            : group.groupId && r.practice_group_id === group.groupId
                                    );
                                    return (
                                        <TableCell key={date}>
                                            {record ? (
                                                <div className="flex items-center gap-1">
                                                    {getBadge(record.status)}
                                                    {record.note && (
                                                        <Info
                                                            className="w-4 h-4 text-gray-500 cursor-pointer"
                                                            onClick={() => !loading && onOpenNote(record.note)}
                                                        />
                                                    )}
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
