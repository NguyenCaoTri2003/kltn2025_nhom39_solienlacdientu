"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LabelRequired } from "@/components/ui/label-requied";
import { toast } from "sonner";
import { useState } from "react";

interface AppointmentModalBaseProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  title?: string;
}

export function AppointmentModalBase({
  open,
  onOpenChange,
  onSubmit,
  title = "Đặt lịch hẹn",
}: AppointmentModalBaseProps) {
  const [form, setForm] = useState({
    title: "",
    date: "",
    start: "",
    end: "",
    content: "",
    location: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" })); 
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const today = new Date().toISOString().split("T")[0];

    if (!form.title.trim()) errs.title = "Vui lòng nhập tiêu đề.";
    if (!form.date) errs.date = "Vui lòng chọn ngày.";

    if (form.date && form.date < today)
      errs.date = "Không thể chọn ngày trong quá khứ.";

    if (!form.start) errs.start = "Vui lòng chọn giờ bắt đầu.";
    if (!form.end) errs.end = "Vui lòng chọn giờ kết thúc.";

    if (form.start && form.end && form.end <= form.start)
      errs.end = "Giờ kết thúc phải sau giờ bắt đầu.";

    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      setLoading(true);
      await onSubmit(form);
      onOpenChange(false);
      toast.success("Tạo lịch hẹn thành công!");
    } catch (e) {
      toast.error("Có lỗi xảy ra khi gửi lịch hẹn.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0]; 

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 mt-4">
          {/* Tiêu đề */}
          <div>
            <LabelRequired required>Tiêu đề</LabelRequired>
            <Input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Nhập tiêu đề buổi hẹn..."
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Ngày + Giờ */}
          <div className="flex gap-2">
            <div className="flex-1">
              <LabelRequired required>Ngày</LabelRequired>
              <Input
                type="date"
                value={form.date}
                min={today}
                onChange={(e) => handleChange("date", e.target.value)}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            <div className="flex-1">
              <LabelRequired required>Giờ bắt đầu</LabelRequired>
              <Input
                type="time"
                value={form.start}
                onChange={(e) => handleChange("start", e.target.value)}
              />
              {errors.start && (
                <p className="text-red-500 text-sm mt-1">{errors.start}</p>
              )}
            </div>

            <div className="flex-1">
              <LabelRequired required>Giờ kết thúc</LabelRequired>
              <Input
                type="time"
                value={form.end}
                onChange={(e) => handleChange("end", e.target.value)}
              />
              {errors.end && (
                <p className="text-red-500 text-sm mt-1">{errors.end}</p>
              )}
            </div>
          </div>

          {/* Nội dung */}
          <div>
            <LabelRequired>Nội dung</LabelRequired>
            <Textarea
              rows={4}
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Nội dung buổi hẹn..."
            />
          </div>

          {/* Địa điểm */}
          <div>
            <LabelRequired>Địa điểm</LabelRequired>
            <Input
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Phòng họp, Google Meet,..."
            />
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi lịch hẹn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
