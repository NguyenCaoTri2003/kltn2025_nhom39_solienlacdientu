"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Student } from "@packages/core/entities/Student";
import { X } from "lucide-react";
import { format } from "date-fns";

interface AttendanceModalProps {
    open: boolean;
    onClose: () => void;
    students: Student[];
    type: string;
    enrollmentMap?: Record<number, number>;
    practiceGroupMap?: Record<number, number>;
    onSubmit: (records: any[]) => Promise<void>;
}

export default function AttendanceModal({ open, onClose, students, type, enrollmentMap, practiceGroupMap, onSubmit }: AttendanceModalProps) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    console.log("enrollmentMap", enrollmentMap);
    console.log("practiceGroupMap", practiceGroupMap);

    useEffect(() => {
        if (open && students.length > 0) {
            const getLastName = (fullName?: string) => {
                if (!fullName) return "";
                const parts = fullName.trim().split(/\s+/);
                return parts[parts.length - 1];
            };

            const sorted = [...students].sort((a, b) => {
                const nameA = getLastName(a.users?.full_name);
                const nameB = getLastName(b.users?.full_name);
                return nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
            });

            setRecords(
                sorted.map(s => ({
                    student: s,
                    status: "present",
                    note: "",
                }))
            );
        }
    }, [open, students]);

    const handleChange = (index: number, key: "status" | "note", value: string) => {
        setRecords(prev =>
            prev.map((r, i) => (i === index ? { ...r, [key]: value } : r))
        );
    };

    const handleDelete = (index: number) => {
        setRecords(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data = records.map(r => {
                const enrollment_id = enrollmentMap?.[r.student.id];
                const practice_group_id = practiceGroupMap?.[r.student.id];

                if (type === "practice" && !practice_group_id) {
                    console.error("Missing practice_group_id for student", r.student.id);
                }
                if (type !== "practice" && !enrollment_id) {
                    console.error("Missing enrollment_id for student", r.student.id);
                }

                return {
                    type,
                    attendance_date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX"),
                    note: r.note || null,
                    status: r.status,
                    enrollment_id: enrollment_id,
                    practice_group_id: type === "practice" ? practice_group_id : null,
                };
            });

            await onSubmit(data);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    if (!open || records.length === 0) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Điểm danh ({records.length} sinh viên)</DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2 mb-4">
                    <Button
                        variant="outline"
                        onClick={() => setRecords(prev => prev.map(r => ({ ...r, status: "present" })))}
                    >
                        Có mặt
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setRecords(prev => prev.map(r => ({ ...r, status: "absent" })))}
                    >
                        Vắng
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setRecords(prev => prev.map(r => ({ ...r, status: "late" })))}
                    >
                        Trễ
                    </Button>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {records.map((r, i) => (
                        <div key={r.student.id} className="flex items-start justify-between gap-3 border rounded-md p-2">
                            <div className="flex-1">
                                <p className="font-medium">{r.student.users?.full_name}</p>
                                <p className="text-sm text-muted-foreground">MSSV: {r.student.student_code}</p>

                                <div className="flex gap-2 mt-2">
                                    {["present", "absent", "late"].map(st => (
                                        <Button
                                            key={st}
                                            size="sm"
                                            variant={r.status === st ? "default" : "outline"}
                                            onClick={() => handleChange(i, "status", st)}
                                        >
                                            {st === "present" ? "Có mặt" : st === "absent" ? "Vắng" : "Trễ"}
                                        </Button>
                                    ))}
                                </div>

                                <Textarea
                                    value={r.note}
                                    onChange={e => handleChange(i, "note", e.target.value)}
                                    placeholder="Ghi chú (nếu có)"
                                    className="mt-2"
                                />
                            </div>

                            <Button variant="ghost" size="icon" onClick={() => handleDelete(i)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <DialogFooter>
                    <Button onClick={onClose} variant="outline">Hủy</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Đang lưu..." : "Lưu điểm danh"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
