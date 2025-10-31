"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { confirmWithToast } from "@/components/ui/confirm-with-toast";
import { MoreHorizontal, Eye, Pencil, Lock, Unlock, FileClock, Loader2 } from "lucide-react";

export type AccountStatus = "active" | "inactive" | "suspended";

interface Props {
  accountId: string;
  accountName: string;
  accountStatus: AccountStatus;
  isBusy?: boolean;
  onChangeStatus: (
    id: string,
    status: AccountStatus
  ) => Promise<{ ok: boolean; message?: string }>;
  onOpenResetPassword: (id: string, name: string) => void;
  onOpenViewDetail?: (id: string, name: string) => void;
}

export function AccountRowActions({
  accountId,
  accountName,
  accountStatus,
  isBusy,
  onChangeStatus,
  onOpenResetPassword,
  onOpenViewDetail,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={!!isBusy}>
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border min-w-48">
        <DropdownMenuItem className="text-popover-foreground hover:bg-accent" onClick={() => onOpenViewDetail?.(accountId, accountName)}>
          <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
        </DropdownMenuItem>
        {/* <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
          <Pencil className="w-4 h-4 mr-2" /> Chỉnh sửa
        </DropdownMenuItem> */}
        {accountStatus === "active" ? (
          <DropdownMenuItem
            className="text-red-400 hover:bg-accent"
            onClick={async () => {
              const ok = await confirmWithToast("Bạn có chắc muốn khóa tài khoản này?");
              if (!ok) return;
              const res = await onChangeStatus(accountId, "inactive");
              if (res.ok) toast.success("Đã khóa tài khoản");
              else toast.error(res.message || "Không thể cập nhật trạng thái");
            }}
            disabled={!!isBusy}
          >
            <Lock className="w-4 h-4 mr-2" /> Khóa tài khoản
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="text-green-400 hover:bg-accent"
            onClick={async () => {
              const ok = await confirmWithToast("Kích hoạt tài khoản này?");
              if (!ok) return;
              const res = await onChangeStatus(accountId, "active");
              if (res.ok) toast.success("Đã kích hoạt tài khoản");
              else toast.error(res.message || "Không thể cập nhật trạng thái");
            }}
            disabled={!!isBusy}
          >
            <Unlock className="w-4 h-4 mr-2" /> Kích hoạt tài khoản
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-popover-foreground hover:bg-accent"
          onClick={() => onOpenResetPassword(accountId, accountName)}
        >
          <FileClock className="w-4 h-4 mr-2 text-yellow-400" /> Đặt lại mật khẩu
        </DropdownMenuItem>
        {/* <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
          <FileClock className="w-4 h-4 mr-2" /> Lịch sử đăng nhập
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
