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
import { Loader2, Upload, PlusCircle } from "lucide-react";
import { createAdminUser } from "@/services/adminPermissionService";
import { validateField } from "@/services/userFormValidationService";

declare const process: { env: Record<string, string | undefined> };

interface CreateAdminModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateAdminModal({ open, onClose, onSuccess }: CreateAdminModalProps) {
  const [mode, setMode] = useState<"single" | "import">("single");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    citizen_id_card: "",
    address: "",
    ethnic: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
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
        form.append("role", "admin");

        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE}/api/users/admin/import`, {
          headers: { Authorization: `Bearer ${token}` },
          method: "POST",
          credentials: "include",
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = data?.error || data?.message || "Import thất bại";
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
        // Validate tất cả các trường bắt buộc
        const newErrors: Record<string, string> = {};
        
        const fullNameError = validateField("fullName", formData.full_name);
        if (fullNameError) newErrors.fullName = fullNameError;
        
        const emailError = validateField("email", formData.email);
        if (emailError) newErrors.email = emailError;
        
        const phoneError = validateField("phone", formData.phone);
        if (phoneError) newErrors.phone = phoneError;
        
        if (formData.citizen_id_card) {
          const citizenIdError = validateField("citizenId", formData.citizen_id_card);
          if (citizenIdError) newErrors.citizenId = citizenIdError;
        }
        
        if (formData.address) {
          const addressError = validateField("address", formData.address);
          if (addressError) newErrors.address = addressError;
        }
        
        if (formData.ethnic) {
          const ethnicError = validateField("ethnic", formData.ethnic);
          if (ethnicError) newErrors.ethnic = ethnicError;
        }
        
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
          return;
        }

        await createAdminUser({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          citizen_id_card: formData.citizen_id_card || undefined,
          address: formData.address || undefined,
          ethnic: formData.ethnic || undefined,
          password: "11111111",
        });

        toast.success("Tạo tài khoản admin thành công!");
        setFormData({ 
          full_name: "", 
          email: "", 
          phone: "", 
          citizen_id_card: "",
          address: "",
          ethnic: ""
        });
        setErrors({});
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra khi xử lý";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const fileName = "Admin_Account_Import_Template.xlsx";
    const url = `/templates/${encodeURIComponent(fileName)}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleModeChange = (newMode: "single" | "import") => {
    setMode(newMode);
    setSummary(null);
    setFile(null);
    setDisableConfirm(false);
    if (newMode === "single") {
      setFormData({ 
        full_name: "", 
        email: "", 
        phone: "", 
        citizen_id_card: "",
        address: "",
        ethnic: ""
      });
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {mode === "single"
              ? "Thêm Admin"
              : "Import danh sách Admin"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Chọn chế độ */}
          <div className="flex gap-2">
            <Button
              variant={mode === "single" ? "default" : "outline"}
              className="flex-1"
              onClick={() => handleModeChange("single")}
            >
              <PlusCircle className="w-4 h-4 mr-1" /> Thêm đơn
            </Button>
            <Button
              variant={mode === "import" ? "default" : "outline"}
              className="flex-1"
              onClick={() => handleModeChange("import")}
            >
              <Upload className="w-4 h-4 mr-1" /> Import file
            </Button>
          </div>

          {/* Nội dung theo mode */}
          {mode === "single" ? (
            <div className="space-y-2">
              <div className="space-y-2">
                <Label>Họ và tên<span className="text-red-500">*</span></Label>
                <Input
                  maxLength={128}
                  placeholder="Nhập họ và tên..."
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value });
                    const error = validateField("fullName", e.target.value);
                    if (error) {
                      setErrors((prev) => ({ ...prev, fullName: error }));
                    } else {
                      setErrors((prev) => {
                        const rest = { ...prev };
                        delete rest.fullName;
                        return rest;
                      });
                    }
                  }}
                  className={errors.fullName ? "border-red-500" : ""}
                />
                {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label>Email<span className="text-red-500">*</span></Label>
                <Input
                  maxLength={100}
                  placeholder="Nhập email..."
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    const error = validateField("email", e.target.value);
                    if (error) {
                      setErrors((prev) => ({ ...prev, email: error }));
                    } else {
                      setErrors((prev) => {
                        const rest = { ...prev };
                        delete rest.email;
                        return rest;
                      });
                    }
                  }}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label>Số điện thoại<span className="text-red-500">*</span></Label>
                <Input
                  maxLength={11}
                  placeholder="Nhập số điện thoại..."
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    const error = validateField("phone", e.target.value);
                    if (error) {
                      setErrors((prev) => ({ ...prev, phone: error }));
                    } else {
                      setErrors((prev) => {
                        const rest = { ...prev };
                        delete rest.phone;
                        return rest;
                      });
                    }
                  }}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label>CCCD</Label>
                <Input
                  maxLength={20}
                  placeholder="Nhập CCCD..."
                  value={formData.citizen_id_card}
                  onChange={(e) => {
                    setFormData({ ...formData, citizen_id_card: e.target.value });
                    if (e.target.value) {
                      const error = validateField("citizenId", e.target.value);
                      if (error) {
                        setErrors((prev) => ({ ...prev, citizenId: error }));
                      } else {
                        setErrors((prev) => {
                          const rest = { ...prev };
                          delete rest.citizenId;
                          return rest;
                        });
                      }
                    } else {
                      setErrors((prev) => {
                        const rest = { ...prev };
                        delete rest.citizenId;
                        return rest;
                      });
                    }
                  }}
                  className={errors.citizenId ? "border-red-500" : ""}
                />
                {errors.citizenId && <p className="text-sm text-red-500">{errors.citizenId}</p>}
              </div>

              <div className="space-y-2">
                <Label>Địa chỉ</Label>
                <Input
                  maxLength={255}
                  placeholder="Nhập địa chỉ..."
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    if (e.target.value) {
                      const error = validateField("address", e.target.value);
                      if (error) {
                        setErrors((prev) => ({ ...prev, address: error }));
                      } else {
                        setErrors((prev) => {
                          const rest = { ...prev };
                          delete rest.address;
                          return rest;
                        });
                      }
                    } else {
                      setErrors((prev) => {
                        const rest = { ...prev };
                        delete rest.address;
                        return rest;
                      });
                    }
                  }}
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="space-y-2">
                <Label>Dân tộc</Label>
                <Input
                  maxLength={20}
                  placeholder="Nhập dân tộc..."
                  value={formData.ethnic}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  name="admin-ethnic"
                  onChange={(e) => {
                    setFormData({ ...formData, ethnic: e.target.value });
                    if (e.target.value) {
                      const error = validateField("ethnic", e.target.value);
                      if (error) {
                        setErrors((prev) => ({ ...prev, ethnic: error }));
                      } else {
                        setErrors((prev) => {
                          const rest = { ...prev };
                          delete rest.ethnic;
                          return rest;
                        });
                      }
                    } else {
                      setErrors((prev) => {
                        const rest = { ...prev };
                        delete rest.ethnic;
                        return rest;
                      });
                    }
                  }}
                  className={errors.ethnic ? "border-red-500" : ""}
                />
                {errors.ethnic && <p className="text-sm text-red-500">{errors.ethnic}</p>}
              </div>
            </div>
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
              <p
                onClick={handleDownloadTemplate}
                className="text-sm text-blue-600 hover:underline cursor-pointer"
              >
                Tải mẫu
              </p>

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
            disabled={
              loading ||
              (mode === "import" && disableConfirm) ||
              (mode === "single" && (
                !formData.full_name || 
                !formData.email || 
                !formData.phone || 
                Object.keys(errors).length > 0
              ))
            }
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

