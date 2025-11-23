"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { supabase } from "@packages/data/supabaseClient";
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
import { Loader2, X } from "lucide-react";
import { Student } from "@packages/core/entities/Student";

declare const process: { env: Record<string, string | undefined> };

type NotificationType = "university" | "lecturer" | "system";
type NotificationCategory = "ACADEMIC" | "SYSTEM" | "FINANCE" | "GENERAL";

const uploadFileToStorage = async (file: File): Promise<string> => {
  const filePath = `${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from("chat-uploads").upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from("chat-uploads").getPublicUrl(filePath);
  return data.publicUrl;
};

interface CreateNotificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  selectedStudentIds?: number[]; // Student IDs đã chọn từ bảng
  students?: Student[]; // Danh sách students để map sang user_ids
}

export function CreateNotificationModal({
  open,
  onClose,
  onSuccess,
  selectedStudentIds = [],
  students = [],
}: CreateNotificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const type: NotificationType = "lecturer";
  const [category, setCategory] = useState<NotificationCategory>("ACADEMIC");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const currentUserIds = useMemo(() => {
    return selectedStudentIds.filter((id): id is number => id !== undefined);
  }, [selectedStudentIds]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB");
      return;
    }

    setSelectedImage(file);
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  useEffect(() => {
    if (!open) {
      setTitle("");
      setContent("");
      setSelectedImage(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
    }
  }, [open, imagePreview]);

  // Debug: Log khi modal mở
  useEffect(() => {
    if (open) {
      console.log("Modal opened with selectedStudentIds:", selectedStudentIds);
      console.log("Current userIds:", currentUserIds);
      console.log("Students:", students.length);
    }
  }, [open, selectedStudentIds, currentUserIds, students]);

  const handleSubmit = async () => {
    if (!title && !content) {
      toast.error("Vui lòng nhập tiêu đề hoặc nội dung");
      return;
    }

    const userIdsToSend = currentUserIds;
    console.log("Submitting with userIds:", userIdsToSend);
    console.log("selectedStudentIds:", selectedStudentIds);
    console.log("students count:", students.length);
    
    if (userIdsToSend.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sinh viên từ bảng");
      return;
    }

    setLoading(true);
    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const token = localStorage.getItem("token");

      let imageUrl: string | null = null;
      if (selectedImage) {
        try {
          imageUrl = await uploadFileToStorage(selectedImage);
        } catch (error) {
          console.error("Error uploading image:", error);
          toast.error("Lỗi khi upload ảnh");
          setLoading(false);
          return;
        }
      }

      const payload = {
        user_ids: userIdsToSend,
        title: title || null,
        content: content || null,
        type,
        category,
        url: imageUrl || null,
      };

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

      if (data?.data?.created) {
        toast.success(
          `Đã gửi thông báo đến ${data.data.created} sinh viên`
        );
      } else {
        toast.success("Tạo thông báo thành công");
      }

      setTitle("");
      setContent("");
      setCategory("ACADEMIC");
      handleRemoveImage();

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
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-white">
          <DialogHeader>
            <DialogTitle>Tạo thông báo mới</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề thông báo"
                className="bg-white"
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
                className="bg-white"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
              <Select
                value={category}
                onValueChange={(v: NotificationCategory) => setCategory(v)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACADEMIC">Học vụ</SelectItem>
                  <SelectItem value="GENERAL">Chung</SelectItem>
                  {/* <SelectItem value="SYSTEM">Hệ thống</SelectItem> */}
                  <SelectItem value="FINANCE">Tài chính</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Ảnh đính kèm (tùy chọn)</Label>
              {!imagePreview ? (
                <div className="flex items-center gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1 bg-white"
                  />
                </div>
              ) : (
                <div className="relative inline-block">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={600}
                    height={192}
                    className="max-w-full h-48 object-contain rounded-lg border border-gray-300"
                    unoptimized
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Chấp nhận: JPG, PNG, GIF, WEBP (tối đa 5MB)
              </p>
            </div>

            {/* Selected students info */}
            {selectedStudentIds.length > 0 && currentUserIds.length > 0 && (
              <div className="space-y-2">
                <Label>Sinh viên nhận thông báo ({selectedStudentIds.length})</Label>
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  <div className="divide-y">
                    {selectedStudentIds.map((studentId) => {
                      const student = students.find((s) => s.id === studentId);
                      if (!student) return null;
                      return (
                        <div
                          key={studentId}
                          className="p-3 flex items-center justify-between hover:bg-gray-50"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">
                              {student.users?.full_name || "Chưa có tên"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {student.student_code} • {student.users?.email || "-"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {selectedStudentIds.length === 0 && (
              <div className="space-y-2">
                <Label>Sinh viên nhận thông báo *</Label>
                <div className="text-sm text-amber-600 p-4 border border-amber-200 rounded-md bg-amber-50">
                  Vui lòng chọn ít nhất một sinh viên từ bảng bên ngoài trước khi tạo thông báo
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi thông báo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

