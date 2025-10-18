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
import { Loader2, Upload, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { AddSingleUserForm, type SingleFormData } from "./AddSingleUserForm";

type RoleType = "student" | "lecturer" | "parent" | "admin";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

declare const process: { env: Record<string, string | undefined> };
export function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
  const [mode, setMode] = useState<"single" | "import">("single"); // Thêm đơn / Import file
  const [role, setRole] = useState<RoleType>("student");
  const [loading, setLoading] = useState(false);
  const [singleData, setSingleData] = useState<SingleFormData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [disableConfirm, setDisableConfirm] = useState(false);
  const [summary, setSummary] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: { row: number; message: string }[];
  } | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === "import") {
        if (!file) {
          toast.error("Vui lòng chọn tệp Excel để import.");
          return;
        }
        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const form = new FormData();
        form.append("file", file);
        form.append("role", role);

        const res = await fetch(`${API_BASE}/api/users/admin/import`, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.error || "Import thất bại";
          toast.error(msg);
          return;
        }
        const sum = data?.summary as typeof summary;
        if (sum) setSummary(sum);
        toast.success(
          `Import thành công: ${sum?.success ?? 0}/${sum?.total ?? 0} dòng${
            sum && sum.failed > 0 ? `, lỗi: ${sum.failed}` : ""
          }`
        );

        if (sum && sum.failed > 0) {
          setDisableConfirm(true);
        } else {

          onSuccess?.();
          onClose();
        }
      } else {

        if (!singleData || !singleData.user?.full_name) {
          toast.error("Vui lòng nhập đầy đủ thông tin tối thiểu (Họ và tên)");
          return;
        }
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const payload: SingleFormData = {
          ...singleData,
          user: { ...singleData.user, role },
        };
        if (role === "parent" && !payload.student_parent) {
          toast.error("Phụ huynh cần liên kết với một sinh viên (student_parent)");
          return;
        }
        const res = await fetch(`${API_BASE}/api/users/admin/create`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data?.error || "Tạo tài khoản thất bại");
          return;
        }
        toast.success("Đã thêm người dùng thành công");
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi xử lý");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const roleToFile: Record<typeof role, string | null> = {
      student: "Student_Account_Import_Template.xlsx",
      lecturer: "Lecturer_Account_Import_Template.xlsx",
      parent: "Parent_Account_Import_Template.xlsx",
      admin: "Admin_Account_Import_Template.xlsx",
    };

    const fileName = roleToFile[role];
    if (!fileName) {
      toast.info("Hiện chưa có mẫu cho loại tài khoản này.");
      return;
    }

    const url = `/templates/${encodeURIComponent(fileName)}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {mode === "single"
              ? "Thêm người dùng"
              : "Import danh sách người dùng"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Chọn chế độ */}
          <div className="flex gap-2">
            <Button
              variant={mode === "single" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("single")}
            >
              <PlusCircle className="w-4 h-4 mr-1" /> Thêm đơn
            </Button>
            <Button
              variant={mode === "import" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("import")}
            >
              <Upload className="w-4 h-4 mr-1" /> Import file
            </Button>
          </div>

          {/* Chọn loại tài khoản */}
          <div className="space-y-2">
            <Label>Loại tài khoản</Label>
            <Select value={role} onValueChange={(v: RoleType) => setRole(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại tài khoản" />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                <SelectItem value="student">Sinh viên</SelectItem>
                <SelectItem value="lecturer">Giảng viên</SelectItem>
                <SelectItem value="parent">Phụ huynh</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nội dung theo mode */}
          {mode === "single" ? (
            <AddSingleUserForm role={role} onChange={setSingleData} />
          ) : (
            <div className="space-y-3">
              <Label>Chọn tệp Excel để import</Label>
              <Input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setSummary(null);

                  setDisableConfirm(false);
                }}
              />

              <p className="text-sm text-muted-foreground">
                Bạn có thể tải mẫu file phù hợp với loại tài khoản đã chọn.
              </p>
              <Button
                variant="secondary"
                className="w-full text-blue-800"
                onClick={handleDownloadTemplate}
              >
                Tải mẫu {role}
              </Button>

              {summary && (
                <div className="mt-2 rounded-md border border-border p-3 text-sm">
                  <p>
                    Tổng: <b>{summary.total}</b> • Thành công:{" "}
                    <b>{summary.success}</b> • Thất bại: <b>{summary.failed}</b>
                  </p>
                  {summary.errors?.length > 0 && (
                    <div className="mt-2 text-red-400">
                      <p className="font-medium">Các dòng lỗi (tối đa 5):</p>
                      <ul className="list-disc ml-5 space-y-1">
                        {summary.errors.slice(0, 5).map((er, idx) => (
                          <li key={`${er.row}-${idx}`}>
                            Dòng {er.row}: {er.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (mode === "import" && disableConfirm)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Xác nhận"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
