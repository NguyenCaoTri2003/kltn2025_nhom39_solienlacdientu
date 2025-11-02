"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

declare const process: { env: Record<string, string | undefined> };

type NotificationType = "university" | "lecturer" | "system";
type NotificationCategory = "ACADEMIC" | "SYSTEM" | "FINANCE" | "GENERAL";

interface CreateNotificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateNotificationModal({
  open,
  onClose,
  onSuccess,
}: CreateNotificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<NotificationType>("university");
  const [category, setCategory] = useState<NotificationCategory>("GENERAL");
  const [mode, setMode] = useState<"single" | "broadcast">("broadcast");

  const handleSubmit = async () => {
    if (!title && !content) {
      toast.error("Vui lòng nhập tiêu đề hoặc nội dung");
      return;
    }

    setLoading(true);
    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const token = localStorage.getItem("token");

      const payload: {
        title: string | null;
        content: string | null;
        type: NotificationType;
        category: NotificationCategory;
        mode?: string;
      } = {
        title: title || null,
        content: content || null,
        type,
        category,
      };

      if (mode === "broadcast") {
        payload.mode = "broadcast";
      } else {
        // Single notification - sẽ thêm sau
        toast.error("Chế độ gửi đơn lẻ chưa được hỗ trợ");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.message || "Tạo thông báo thất bại";
        toast.error(msg);
        return;
      }

      toast.success(
        mode === "broadcast"
          ? "Đã gửi thông báo đến tất cả người dùng"
          : "Tạo thông báo thành công"
      );

      setTitle("");
      setContent("");
      setType("university");
      setCategory("GENERAL");
      setMode("broadcast");

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating notification:", error);
      toast.error("Có lỗi xảy ra khi tạo thông báo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo thông báo mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mode selection */}
          <div className="space-y-2">
            <Label>Chế độ</Label>
            <Select
              value={mode}
              onValueChange={(v: "single" | "broadcast") => setMode(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="broadcast">Gửi cho tất cả</SelectItem>
                <SelectItem value="single" disabled>
                  Gửi cho người dùng cụ thể (sắp có)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề thông báo"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung thông báo"
              rows={5}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Loại thông báo</Label>
            <Select
              value={type}
              onValueChange={(v: NotificationType) => setType(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="university">Đại học</SelectItem>
                <SelectItem value="lecturer">Giảng viên</SelectItem>
                <SelectItem value="system">Hệ thống</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Danh mục</Label>
            <Select
              value={category}
              onValueChange={(v: NotificationCategory) => setCategory(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">Chung</SelectItem>
                <SelectItem value="ACADEMIC">Học thuật</SelectItem>
                <SelectItem value="SYSTEM">Hệ thống</SelectItem>
                <SelectItem value="FINANCE">Tài chính</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo thông báo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

