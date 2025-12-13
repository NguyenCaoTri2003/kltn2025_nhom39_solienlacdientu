"use client";

import { useState, useEffect } from "react";
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
import { Loader2, AlertCircle } from "lucide-react";
import { translateRole } from "@packages/utils/translations";
import {
  isValidEmail,
  isValidPhone,
  isValidCitizenId,
  isValidAddress,
  isValidEthnic,
  isValidFullName,
} from "@packages/utils/Regex";
import {
  fetchUserById,
  updateUser,
  getToken,
} from "@/services/accountManagementService";

declare const process: { env: Record<string, string | undefined> };

interface EditUserModalProps {
  open: boolean;
  userId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UserData {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  ethnic: string;
  citizen_id_card: string;
  role: string;
}

export function EditUserModal({
  open,
  userId,
  onClose,
  onSuccess,
}: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Fetch user data when modal opens
  useEffect(() => {
    let ignore = false;
    async function fetchUser() {
      if (!open || !userId) return;
      setFetching(true);
      setErrors({});
      try {
        const token = getToken();
        const data = await fetchUserById(userId, token, API_BASE);
        
        if (!ignore) {
          setUserData(data);
          setFormData({
            full_name: data.full_name || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            ethnic: data.ethnic || "",
            citizen_id_card: data.citizen_id_card || "",
          });
        }
      } catch (error) {
        if (!ignore) {
          const message =
            error instanceof Error
              ? error.message
              : "Lỗi kết nối máy chủ";
          setErrors({ fetch: message });
          toast.error(message);
        }
      } finally {
        if (!ignore) setFetching(false);
      }
    }

    fetchUser();
    return () => {
      ignore = true;
    };
  }, [open, userId, API_BASE]);

  const validateField = (
    field: keyof UserData,
    value: string
  ): string | undefined => {
    switch (field) {
      case "full_name":
        if (!value.trim()) return "Họ và tên là bắt buộc";
        if (!isValidFullName(value)) return "Họ và tên không hợp lệ";
        return undefined;
      case "email":
        if (!value.trim()) return "Email là bắt buộc";
        if (!isValidEmail(value)) return "Email không hợp lệ";
        return undefined;
      case "phone":
        if (!value.trim()) return "Số điện thoại là bắt buộc";
        if (!isValidPhone(value)) return "Số điện thoại không hợp lệ";
        return undefined;
      case "address":
        if (!value.trim()) return undefined;
        if (!isValidAddress(value)) return "Địa chỉ không hợp lệ";
        return undefined;
      case "ethnic":
        if (!value.trim()) return undefined;
        if (!isValidEthnic(value)) return "Dân tộc không hợp lệ";
        return undefined;
      case "citizen_id_card":
        if (!value.trim()) return "CCCD là bắt buộc";
        if (!isValidCitizenId(value)) return "CCCD không hợp lệ";
        return undefined;
      default:
        return undefined;
    }
  };

  const handleFieldChange = (field: keyof UserData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
      } else {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  const handleSubmit = async () => {
    if (!userId || !userData) return;

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const field = key as keyof UserData;
      const value = formData[field] as string;
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Vui lòng kiểm tra lại các trường không hợp lệ");
      return;
    }

    setLoading(true);
    try {
      const token = getToken();

      // Only send changed fields
      const updates: Record<string, string> = {};
      Object.keys(formData).forEach((key) => {
        const field = key as keyof UserData;
        const newValue = formData[field] as string;
        const oldValue = userData[field] as string;
        if (newValue !== oldValue) {
          updates[field] = newValue;
        }
      });

      if (Object.keys(updates).length === 0) {
        toast.info("Không có thay đổi nào");
        onClose();
        return;
      }

      await updateUser(userId, updates, token, API_BASE);

      onSuccess?.();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Có lỗi xảy ra";
      toast.error(message);
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;
  
  // Check if there are any changes compared to original data
  const hasChanges = (() => {
    if (!userData) return false;
    
    const fieldsToCompare: (keyof UserData)[] = [
      "full_name",
      "email",
      "phone",
      "address",
      "ethnic",
      "citizen_id_card",
    ];
    
    return fieldsToCompare.some((field) => {
      const newValue = String(formData[field] || "").trim();
      const oldValue = String(userData[field] || "").trim();
      return newValue !== oldValue;
    });
  })();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Sửa thông tin tài khoản
          </DialogTitle>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Đang tải thông tin...</span>
          </div>
        ) : errors.fetch ? (
          <div className="py-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <span>{errors.fetch}</span>
            </div>
          </div>
        ) : userData ? (
          <div className="space-y-4 py-2">
            {/* Role (Read-only) */}
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Vai trò</Label>
                <Input
                  value={translateRole(userData.role)}
                  disabled
                  className="bg-background cursor-not-allowed"
                />
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  maxLength={128}
                  value={formData.full_name || ""}
                  onChange={(e) => handleFieldChange("full_name", e.target.value)}
                  className={
                    errors.full_name
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }
                />
                {errors.full_name && (
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {errors.full_name}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    maxLength={100}
                    value={formData.email || ""}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className={
                      errors.email
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }
                  />
                  {errors.email && (
                    <div className="flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Số điện thoại <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    maxLength={10}
                    value={formData.phone || ""}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    className={
                      errors.phone
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }
                  />
                  {errors.phone && (
                    <div className="flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      {errors.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  maxLength={255}
                  value={formData.address || ""}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  className={
                    errors.address
                      ? "border-red-500 focus:border-red-500"
                      : ""
                  }
                />
                {errors.address && (
                  <div className="flex items-center gap-2 text-xs text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    {errors.address}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ethnic */}
                <div className="space-y-2">
                  <Label htmlFor="ethnic">Dân tộc</Label>
                  <Input
                    id="ethnic"
                    maxLength={20}
                    value={formData.ethnic || ""}
                    onChange={(e) => handleFieldChange("ethnic", e.target.value)}
                    className={
                      errors.ethnic
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }
                  />
                  {errors.ethnic && (
                    <div className="flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      {errors.ethnic}
                    </div>
                  )}
                </div>

                {/* CCCD */}
                <div className="space-y-2">
                  <Label htmlFor="citizen_id_card">
                    CCCD <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="citizen_id_card"
                    maxLength={20}
                    value={formData.citizen_id_card || ""}
                    onChange={(e) =>
                      handleFieldChange("citizen_id_card", e.target.value)
                    }
                    className={
                      errors.citizen_id_card
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }
                  />
                  {errors.citizen_id_card && (
                    <div className="flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle className="w-4 h-4" />
                      {errors.citizen_id_card}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading || fetching}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || fetching || hasErrors || !hasChanges}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

