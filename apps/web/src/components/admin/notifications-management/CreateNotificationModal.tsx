"use client";

import { useState } from "react";
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
import { Loader2, X, Users } from "lucide-react";
import { UserSelectionModal } from "./UserSelectionModal";
import { Badge } from "@/components/ui/badge";

declare const process: { env: Record<string, string | undefined> };

type NotificationType = "university" | "lecturer" | "system";
type NotificationCategory = "ACADEMIC" | "SYSTEM" | "FINANCE" | "GENERAL";

interface CreateNotificationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const uploadFileToStorage = async (file: File): Promise<string> => {
  const filePath = `${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from("chat-uploads").upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from("chat-uploads").getPublicUrl(filePath);
  return data.publicUrl;
};

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
  const [mode, setMode] = useState<"broadcast" | "users">("broadcast");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [userSelectionOpen, setUserSelectionOpen] = useState(false);

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

      const payload: {
        title: string | null;
        content: string | null;
        type: NotificationType;
        category: NotificationCategory;
        mode?: string;
        user_ids?: number[];
        url?: string | null;
      } = {
        title: title || null,
        content: content || null,
        type,
        category,
      };

      if (mode === "broadcast") {
        payload.mode = "broadcast";
      } else if (mode === "users") {
        if (selectedUserIds.length === 0) {
          toast.error("Vui lòng chọn ít nhất một người dùng");
          setLoading(false);
          return;
        }
        // Gửi user_ids để route API tự động nhận diện mode "users"
        payload.user_ids = selectedUserIds;
      }

      if (imageUrl) {
        payload.url = imageUrl;
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

      if (mode === "broadcast") {
        toast.success("Đã gửi thông báo đến tất cả người dùng");
      } else if (mode === "users") {
        toast.success(
          `Đã gửi thông báo đến ${data?.data?.created || selectedUserIds.length} người dùng`
        );
      } else {
        toast.success("Tạo thông báo thành công");
      }

      setTitle("");
      setContent("");
      setType("university");
      setCategory("GENERAL");
      setMode("broadcast");
      setSelectedUserIds([]);
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle>Tạo thông báo mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Mode selection */}
          <div className="space-y-2">
            <Label>Chế độ</Label>
            <Select
              value={mode}
              onValueChange={(v: "broadcast" | "users") => {
                setMode(v);
                if (v === "broadcast") {
                  setSelectedUserIds([]);
                }
              }}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="broadcast">Gửi cho tất cả</SelectItem>
                <SelectItem value="users">Gửi cho người dùng cụ thể</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User selection for "users" mode */}
          {mode === "users" && (
            <div className="space-y-2">
              <Label>Người nhận</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUserSelectionOpen(true)}
                  className="flex-1"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Chọn người dùng
                  {selectedUserIds.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedUserIds.length}
                    </Badge>
                  )}
                </Button>
              </div>
              {selectedUserIds.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Đã chọn {selectedUserIds.length} người dùng
                </div>
              )}
            </div>
          )}

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

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Loại thông báo</Label>
            <Select
              value={type}
              onValueChange={(v: NotificationType) => setType(v)}
            >
              <SelectTrigger className="bg-white">
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
              <SelectTrigger className="bg-white">
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

      {/* User Selection Modal */}
      <UserSelectionModal
        open={userSelectionOpen}
        onClose={() => setUserSelectionOpen(false)}
        onConfirm={(userIds) => {
          setSelectedUserIds(userIds);
          setUserSelectionOpen(false);
        }}
        selectedUserIds={selectedUserIds}
      />
    </Dialog>
  );
}

