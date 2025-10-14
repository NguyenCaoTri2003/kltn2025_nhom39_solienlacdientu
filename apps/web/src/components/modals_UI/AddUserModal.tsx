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

type RoleType = "student" | "lecturer" | "parent" | "admin";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Allow using process.env in client without Node types
declare const process: { env: Record<string, string | undefined> };
export function AddUserModal({ open, onClose, onSuccess }: AddUserModalProps) {
  const [mode, setMode] = useState<"single" | "import">("single"); // Thêm đơn / Import file
  const [role, setRole] = useState<RoleType>(
    "student"
  );
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<
    | {
        total: number;
        success: number;
        failed: number;
        errors: { row: number; message: string }[];
      }
    | null
  >(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (mode === "import") {
        if (!file) {
          toast.error("Vui lòng chọn tệp Excel để import.");
          return;
        }
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
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

      } else {
        // TODO: Thêm đơn - gọi API tạo user đơn lẻ
        await new Promise((r) => setTimeout(r, 800));
        toast.success("Đã thêm người dùng");
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

  const renderRoleInputs = () => {
    switch (role) {
      case "student":
        return (
          <div className="space-y-2">
            <Label>Mã sinh viên</Label>
            <Input placeholder="Nhập mã sinh viên..." />
            <Label>Lớp</Label>
            <Input placeholder="Nhập tên lớp..." />
          </div>
        );
      case "lecturer":
        return (
          <div className="space-y-2">
            <Label>Mã giảng viên</Label>
            <Input placeholder="Nhập mã giảng viên..." />
            <Label>Bộ môn</Label>
            <Input placeholder="Nhập tên bộ môn..." />
          </div>
        );
      case "parent":
        return (
          <div className="space-y-2">
            <Label>Tên phụ huynh</Label>
            <Input placeholder="Nhập họ tên..." />
            <Label>Số điện thoại</Label>
            <Input placeholder="Nhập số điện thoại..." />
          </div>
        );
      case "admin":
        return (
          <div className="space-y-2">
            <Label>Tên quản trị viên</Label>
            <Input placeholder="Nhập họ tên..." />
            <Label>Email</Label>
            <Input placeholder="Nhập email..." />
          </div>
        );
    }
  };

  // Download template tương ứng với role
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
      <DialogContent className="bg-card border-border text-card-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {mode === "single" ? "Thêm người dùng" : "Import danh sách người dùng"}
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
              <SelectContent>
                <SelectItem value="student">Sinh viên</SelectItem>
                <SelectItem value="lecturer">Giảng viên</SelectItem>
                <SelectItem value="parent">Phụ huynh</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nội dung theo mode */}
          {mode === "single" ? (
            <div>{renderRoleInputs()}</div>
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
                }}
              />
              
              <p className="text-sm text-muted-foreground">
                Bạn có thể tải mẫu file phù hợp với loại tài khoản đã chọn.
              </p>
              <Button variant="secondary" className="w-full text-blue-800" onClick={handleDownloadTemplate}>
                Tải mẫu {role}
              </Button>

              {summary && (
                <div className="mt-2 rounded-md border border-border p-3 text-sm">
                  <p>
                    Tổng: <b>{summary.total}</b> • Thành công: <b>{summary.success}</b> • Thất bại: <b>{summary.failed}</b>
                  </p>
                  {summary.errors?.length > 0 && (
                    <div className="mt-2 text-red-400">
                      <p className="font-medium">Các dòng lỗi (tối đa 5):</p>
                      <ul className="list-disc ml-5 space-y-1">
                        {summary.errors.slice(0, 5).map((er, idx) => (
                          <li key={`${er.row}-${idx}`}>Dòng {er.row}: {er.message}</li>
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
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
