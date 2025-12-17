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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { getAdminPermission, updateAdminPermission, type AdminType } from "@/services/adminPermissionService";

interface AssignPermissionModalProps {
  open: boolean;
  onClose: () => void;
  userId: number | null;
  userName: string;
  onSuccess?: () => void;
}

export function AssignPermissionModal({
  open,
  onClose,
  userId,
  userName,
  onSuccess,
}: AssignPermissionModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [adminType, setAdminType] = useState<AdminType>(null);

  useEffect(() => {
    if (open && userId) {
      setFetching(true);
      getAdminPermission(userId)
        .then((data) => {
          setAdminType(data.admin_type);
        })
        .catch((error) => {
          toast.error(error.message || "Không thể lấy thông tin quyền");
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [open, userId]);

  const handleSubmit = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      await updateAdminPermission(userId, adminType);
      toast.success("Cập nhật quyền thành công!");
      onSuccess?.();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cập nhật quyền thất bại";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Phân quyền cho Admin</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm text-muted-foreground">
              Tài khoản: <span className="font-medium">{userName}</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Loại quyền</Label>
            <Select
              value={adminType || "none"}
              onValueChange={(value) => setAdminType(value === "none" ? null : (value as AdminType))}
              disabled={fetching}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại quyền" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Chưa phân quyền</SelectItem>
                <SelectItem value="super_admin">Toàn quyền Quản trị</SelectItem>
                <SelectItem value="admin">Quản trị viên (admin)</SelectItem>
                {/* <SelectItem value="admin_account">Quản trị Tài khoản</SelectItem>
                <SelectItem value="admin_academic">Quản trị Học vụ</SelectItem>
                <SelectItem value="admin_finance">Quản trị Tài chính</SelectItem> */}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Toàn quyền Quản trị có toàn quyền. Các loại Quản trị khác chỉ có quyền trong phạm vi của mình.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading || fetching}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading || fetching}>
            {loading || fetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Cập nhật quyền"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

