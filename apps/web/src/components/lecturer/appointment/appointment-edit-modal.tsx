"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Appointment } from "@packages/core/entities/Appointment";
import { LabelRequired } from "@/components/ui/label-requied";

export function AppointmentEditModal({
    appointment,
    onClose,
    onSave,
}: {
    appointment: Appointment;
    onClose: () => void;
    onSave: (updated: Appointment) => void;
}) {
    const [form, setForm] = useState(appointment);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (key: keyof Appointment, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        const newErrors: Record<string, string> = {};
        const now = new Date();
        const start = new Date(form.start_time);
        const end = new Date(form.end_time);

        if (!form.title?.trim()) {
            newErrors.title = "Tiêu đề không được để trống";
        }
        if (!form.start_time) {
            newErrors.start_time = "Vui lòng chọn thời gian bắt đầu";
        } else if (start < now) {
            newErrors.start_time = "Thời gian bắt đầu phải sau thời điểm hiện tại";
        }

        if (!form.end_time) {
            newErrors.end_time = "Vui lòng chọn thời gian kết thúc";
        } else if (end <= start) {
            newErrors.end_time = "Thời gian kết thúc phải sau thời gian bắt đầu";
        }

        setErrors(newErrors);
    }, [form]);

    const hasError = Object.keys(errors).length > 0;

    const handleSubmit = async () => {
        if (hasError) return;
        setSaving(true);

        const payload = {
            ...form,
            start_time: new Date(form.start_time).toISOString(),
            end_time: new Date(form.end_time).toISOString(),
        };
        await onSave(payload);
        setSaving(false);
    };


    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa lịch hẹn</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div>
                        <LabelRequired required>Tiêu đề cuộc hẹn</LabelRequired>
                        <Input
                            id="title"
                            placeholder="Nhập tiêu đề..."
                            value={form.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="content">Nội dung</Label>
                        <Textarea
                            id="content"
                            placeholder="Nhập nội dung cuộc hẹn..."
                            value={form.content ?? ""}
                            onChange={(e) => handleChange("content", e.target.value)}
                        />
                    </div>

                    <div>
                        <LabelRequired required>Thời gian bắt đầu</LabelRequired>
                        <Input
                            id="start_time"
                            type="datetime-local"
                            value={
                                form.start_time
                                    ? new Date(form.start_time)
                                        .toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
                                        .replace(" ", "T")
                                        .slice(0, 16)
                                    : ""
                            }
                            onChange={(e) => handleChange("start_time", e.target.value)}
                        />
                        {errors.start_time && (
                            <p className="text-sm text-red-500 mt-1">{errors.start_time}</p>
                        )}
                    </div>

                    <div>
                        <LabelRequired required>Thời gian kết thúc</LabelRequired>
                        <Input
                            id="end_time"
                            type="datetime-local"
                            value={
                                form.end_time
                                    ? new Date(form.end_time)
                                        .toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })
                                        .replace(" ", "T")
                                        .slice(0, 16)
                                    : ""
                            }
                            onChange={(e) => handleChange("end_time", e.target.value)}
                        />
                        {errors.end_time && (
                            <p className="text-sm text-red-500 mt-1">{errors.end_time}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="location">Địa điểm</Label>
                        <Input
                            id="location"
                            placeholder="Ví dụ: Phòng họp A1"
                            value={form.location ?? ""}
                            onChange={(e) => handleChange("location", e.target.value)}
                        />
                    </div>

                    <div>
                        <LabelRequired required>Trạng thái</LabelRequired>
                        <Select
                            value={form.status}
                            onValueChange={(value: any) =>
                                handleChange("status", value as Appointment["status"])
                            }
                        >
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                                <SelectItem value="completed">Hoàn tất</SelectItem>
                                <SelectItem value="canceled">Đã hủy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit} disabled={saving || hasError}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Lưu thay đổi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
