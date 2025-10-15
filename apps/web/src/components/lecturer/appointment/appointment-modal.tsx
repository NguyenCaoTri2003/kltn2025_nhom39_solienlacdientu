"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LabelRequired } from "@/components/ui/label-requied";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Student } from "@packages/core/entities/Student";
import { Checkbox } from "@/components/ui/checkbox";

export default function AppointmentModal({
    appointmentModalOpen,
    setAppointmentModalOpen,
    selectedIds,
    students,
}: {
    appointmentModalOpen: boolean;
    setAppointmentModalOpen: (v: boolean) => void;
    selectedIds: number[];
    students: Student[];
}) {
    const router = useRouter();

    const [appointmentData, setAppointmentData] = useState({
        title: "",
        date: "",
        start: "",
        end: "",
        content: "",
        location: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isValidForm, setIsValidForm] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({
        title: false,
        date: false,
        start: false,
        end: false,
        content: false,
        location: false,
        students: false,
    });

    const [selectedParents, setSelectedParents] = useState<Record<number, number[]>>({});

    const updateAppointmentData = (field: string, value: string) => {
        setAppointmentData((prev) => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        if (appointmentModalOpen) {
            setAppointmentData({ title: "", date: "", start: "", end: "", content: "", location: "" });
            setErrors({});
            setIsValidForm(false);
            setTouched({
                title: false,
                date: false,
                start: false,
                end: false,
                content: false,
                location: false,
                students: false,
            });

            const defaultSelectedParents: Record<number, number[]> = {};
            selectedIds.forEach((sid) => {
                const s = students.find((st) => st.id === sid);
                const parents = s?.student_parent?.flatMap(sp => sp.parents) || [];
                defaultSelectedParents[sid] = parents.filter(p => p !== undefined).map(p => p.id);
            });
            setSelectedParents(defaultSelectedParents);
        }
    }, [appointmentModalOpen, selectedIds, students]);

    useEffect(() => {
        const { title, date, start, end } = appointmentData;
        const newErrors: Record<string, string> = {};

        if (!title) newErrors.title = "Vui lòng nhập tiêu đề";
        if (!date) newErrors.date = "Vui lòng chọn ngày";
        if (!start) newErrors.start = "Vui lòng chọn giờ bắt đầu";
        if (!end) newErrors.end = "Vui lòng chọn giờ kết thúc";

        const now = new Date();
        const startTime = new Date(`${date}T${start}`);
        const endTime = new Date(`${date}T${end}`);

        if (date && start && !isNaN(startTime.getTime()) && startTime < now)
            newErrors.start = "Giờ bắt đầu phải sau thời điểm hiện tại";

        if (date && start && end && !isNaN(endTime.getTime()) && endTime <= startTime)
            newErrors.end = "Giờ kết thúc phải sau giờ bắt đầu";

        if (selectedIds.length === 0) newErrors.students = "Vui lòng chọn ít nhất một sinh viên";

        const validStudents = selectedIds
            .map((sid) => students.find((s) => s.id === sid))
            .filter(Boolean);

        if (validStudents.length === 0) newErrors.students = "Không tìm thấy sinh viên hợp lệ";

        // Kiểm tra phụ huynh đã chọn
        const studentsWithoutParents: string[] = [];
        validStudents.forEach((s) => {
            const parents = s?.student_parent?.flatMap(sp => sp.parents) || [];
            const selected = selectedParents[s!.id] || [];
            if (parents.length === 0 || selected.length === 0) {
                studentsWithoutParents.push(s!.users?.full_name ?? "Không rõ tên sinh viên");
            }
        });

        if (studentsWithoutParents.length > 0) {
            newErrors.students = `Các sinh viên sau chưa có thông tin phụ huynh hoặc chưa chọn phụ huynh: ${studentsWithoutParents.join(", ")}`;
        }

        setErrors(newErrors);
        setIsValidForm(Object.keys(newErrors).length === 0);
    }, [appointmentData, selectedIds, students, selectedParents]);

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const handleToggleParent = (studentId: number, parentId: number) => {
        setSelectedParents((prev) => {
            const current = prev[studentId] || [];
            if (current.includes(parentId)) {
                return { ...prev, [studentId]: current.filter((id) => id !== parentId) };
            } else {
                return { ...prev, [studentId]: [...current, parentId] };
            }
        });
    };

    const handleSendAppointment = async () => {
        try {
            setIsLoading(true);
            const { title, date, start, end, content, location } = appointmentData;
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Bạn chưa đăng nhập");
                return;
            }

            const validStudents = selectedIds
                .map((sid) => students.find((s) => s.id === sid))
                .filter(Boolean);

            const toUTCString = (date: string, time: string) =>
                new Date(`${date}T${time}:00+07:00`).toISOString();

            const start_time = toUTCString(date, start);
            const end_time = toUTCString(date, end);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    content,
                    start_time,
                    end_time,
                    location,
                    studentIds: validStudents.map((s) => s!.id),
                    parentIds: Object.values(selectedParents).flat(),
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Lỗi khi tạo lịch hẹn");

            toast.success("Đặt lịch hẹn thành công!");
            setAppointmentModalOpen(false);
            setAppointmentData({
                title: "",
                date: "",
                start: "",
                end: "",
                content: "",
                location: "",
            });
            router.push("/lecturer/appointments");
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi tạo lịch hẹn");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={appointmentModalOpen} onOpenChange={setAppointmentModalOpen}>
            <DialogContent className="max-w-4xl flex flex-col max-h-[90vh]">
                <DialogHeader className="flex-shrink-0 border-b pb-2">
                    <DialogTitle>Đặt lịch hẹn với phụ huynh</DialogTitle>
                </DialogHeader>

                {/* Nội dung cuộn */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 mt-4">
                    {/* Tiêu đề */}
                    <div>
                        <LabelRequired required>Tiêu đề</LabelRequired>
                        <Input
                            value={appointmentData.title}
                            onChange={(e) => updateAppointmentData("title", e.target.value)}
                            onBlur={() => handleBlur("title")}
                            placeholder="Nhập tiêu đề buổi hẹn..."
                            aria-invalid={!!errors.title && touched.title}
                        />
                        {errors.title && touched.title && (
                            <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                        )}
                    </div>

                    {/* Ngày */}
                    <div>
                        <LabelRequired required>Ngày</LabelRequired>
                        <Input
                            type="date"
                            value={appointmentData.date}
                            onChange={(e) => updateAppointmentData("date", e.target.value)}
                            onBlur={() => handleBlur("date")}
                            min={new Date().toISOString().split("T")[0]}
                            aria-invalid={!!errors.date && touched.date}
                        />
                        {errors.date && touched.date && (
                            <p className="text-sm text-red-500 mt-1">{errors.date}</p>
                        )}
                    </div>

                    {/* Giờ bắt đầu & kết thúc */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <LabelRequired required>Giờ bắt đầu</LabelRequired>
                            <Input
                                type="time"
                                value={appointmentData.start}
                                onChange={(e) => updateAppointmentData("start", e.target.value)}
                                onBlur={() => handleBlur("start")}
                                aria-invalid={!!errors.start && touched.start}
                            />
                            {errors.start && touched.start && (
                                <p className="text-sm text-red-500 mt-1">{errors.start}</p>
                            )}
                        </div>
                        <div className="flex-1">
                            <LabelRequired required>Giờ kết thúc</LabelRequired>
                            <Input
                                type="time"
                                value={appointmentData.end}
                                onChange={(e) => updateAppointmentData("end", e.target.value)}
                                onBlur={() => handleBlur("end")}
                                aria-invalid={!!errors.end && touched.end}
                            />
                            {errors.end && touched.end && (
                                <p className="text-sm text-red-500 mt-1">{errors.end}</p>
                            )}
                        </div>
                    </div>

                    {/* Nội dung */}
                    <div>
                        <LabelRequired>Nội dung</LabelRequired>
                        <Textarea
                            rows={4}
                            value={appointmentData.content}
                            onChange={(e) => updateAppointmentData("content", e.target.value)}
                            onBlur={() => handleBlur("content")}
                            placeholder="Nội dung buổi hẹn..."
                        />
                    </div>

                    {/* Địa điểm */}
                    <div>
                        <LabelRequired>Địa điểm</LabelRequired>
                        <Input
                            value={appointmentData.location}
                            onChange={(e) => updateAppointmentData("location", e.target.value)}
                            onBlur={() => handleBlur("location")}
                            placeholder="Phòng họp, Google Meet,..."
                        />
                    </div>

                    {/* Sinh viên & phụ huynh */}
                    {selectedIds.length > 0 && (
                        <div className="space-y-2">
                            <LabelRequired required>Chọn phụ huynh cho sinh viên</LabelRequired>
                            {selectedIds.map((sid) => {
                                const s = students.find((st) => st.id === sid);
                                if (!s) return null;
                                const parents = s.student_parent?.flatMap(sp => sp.parents) || [];
                                return (
                                    <div key={sid} className="border p-2 rounded-md">
                                        <p className="font-semibold">{s.users?.full_name}</p>
                                        {parents.length > 0 ? (
                                            <div className="flex flex-col ml-4 mt-1">
                                                {parents.map((p) =>
                                                    p ? (
                                                        <label key={p.id} className="inline-flex items-center gap-2">
                                                            <Checkbox
                                                                checked={selectedParents[sid]?.includes(p.id)}
                                                                onCheckedChange={() => handleToggleParent(sid, p.id)}
                                                            />
                                                            {p.users?.full_name} - {p.users?.phone}
                                                        </label>
                                                    ) : null
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-red-500 ml-4">
                                                Sinh viên chưa có thông tin phụ huynh
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                            {errors.students && (
                                <p className="text-sm text-red-500 mt-1">{errors.students}</p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-shrink-0 border-t pt-2 mt-4">
                    <Button variant="outline" onClick={() => setAppointmentModalOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSendAppointment} disabled={!isValidForm || isLoading}>
                        {isLoading ? "Đang gửi..." : "Gửi lịch hẹn"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
