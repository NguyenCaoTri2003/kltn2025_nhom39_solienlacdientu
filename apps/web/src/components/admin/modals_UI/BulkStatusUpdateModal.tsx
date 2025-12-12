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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { translateStatus } from "@packages/utils/translations";
import { confirmWithToast } from "@/components/ui/confirm-with-toast";
import {
  bulkUpdateUserStatus,
  getToken,
  type AccountStatus,
} from "@/services/accountManagementService";

interface BulkStatusUpdateModalProps {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  currentStatus: AccountStatus | null;
  onSuccess: (successIds: string[], newStatus: AccountStatus) => void;
  apiBase: string;
}

export function BulkStatusUpdateModal({
  open,
  onClose,
  selectedIds,
  currentStatus,
  onSuccess,
  apiBase,
}: BulkStatusUpdateModalProps) {
  const [targetStatus, setTargetStatus] = useState<AccountStatus>("inactive");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một tài khoản");
      return;
    }

    if (currentStatus !== null && targetStatus === currentStatus) {
      toast.info("Hãy chọn trạng thái khác hiện tại");
      return;
    }

    const ok = await confirmWithToast(
      `Cập nhật ${selectedIds.length} tài khoản sang trạng thái '${translateStatus(targetStatus)}'?`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const token = getToken();
      const { successIds, failedCount } = await bulkUpdateUserStatus(
        selectedIds,
        targetStatus,
        token,
        apiBase
      );

      if (failedCount > 0) {
        toast.error(`Cập nhật thất bại ${failedCount} tài khoản`);
      }
      if (successIds.length > 0) {
        toast.success(`Đã cập nhật ${successIds.length} tài khoản`);
        onSuccess(successIds, targetStatus);
        onClose();
      }
    } catch (error) {
      console.error("Error bulk updating status:", error);
      toast.error("Có lỗi khi cập nhật trạng thái hàng loạt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái hàng loạt</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Đã chọn: <span className="font-medium">{selectedIds.length}</span> tài khoản
            </p>
            {currentStatus && (
              <p className="text-sm text-muted-foreground">
                Trạng thái hiện tại:{" "}
                <span className="font-medium">{translateStatus(currentStatus)}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Chọn trạng thái mới</label>
            <Select
              value={targetStatus}
              onValueChange={(v: string) => setTargetStatus(v as AccountStatus)}
            >
              <SelectTrigger className="bg-white border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Bị khóa</SelectItem>
                <SelectItem value="suspended">Chờ kích hoạt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={loading || selectedIds.length === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              "Xác nhận"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

