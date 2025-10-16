"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  userName?: string;
  onSuccess?: () => void;
}

export function ResetPasswordModal({
  open,
  onClose,
  userId,
  userName,
  onSuccess,
}: ResetPasswordModalProps) {
  const DEFAULT_PASSWORD = "11111111";

  const [newPassword, setNewPassword] = useState(DEFAULT_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Reset lại khi mở modal
  useEffect(() => {
    if (open) {
      setNewPassword(DEFAULT_PASSWORD);
      setError(null);
    }
  }, [open]);

  const handleReset = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: Number(userId), newPassword }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Lỗi không xác định");
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e.message || "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Đặt lại mật khẩu
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {userName ? `Tài khoản: ${userName}` : ""}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <label className="text-sm font-medium">Mật khẩu mới (mặc định)</label>
          <Input
           //type="password"
            value={newPassword}
            disabled
            readOnly
            className="bg-muted border-border text-muted-foreground cursor-not-allowed"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={handleReset}
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
