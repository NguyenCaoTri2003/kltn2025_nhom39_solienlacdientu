"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { AccountRowActions } from "@/components/admin/modals_UI/AccountRowActions";
import { translateRole, translateStatus } from "@packages/utils/translations";
import { toast } from "sonner";
import { confirmWithToast } from "@/components/ui/confirm-with-toast";
import type { Account, AccountStatus, AccountRole } from "@/services/accountManagementService";

type RoleOption = "all" | AccountRole;

interface AccountTableProps {
  accounts: Account[];
  loading: boolean;
  roleFilter: RoleOption;
  selectedIds: string[];
  selectedStatus: AccountStatus | null;
  onSelectedIdsChange: (ids: string[]) => void;
  onSelectedStatusChange: (status: AccountStatus | null) => void;
  rowActionId: string | null;
  onChangeStatus: (
    accountId: string,
    nextStatus: AccountStatus
  ) => Promise<{ ok: boolean; message?: string }>;
  onOpenResetPassword: (id: string, name: string) => void;
  onOpenViewDetail: (id: string, name: string) => void;
  onOpenEdit?: (id: string, name: string) => void;
  hasSearched: boolean;
}

const getStatusBadge = (status: string) => {
  const text = translateStatus(status);
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          {text}
        </Badge>
      );
    case "inactive":
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          {text}
        </Badge>
      );
    case "suspended":
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          {text}
        </Badge>
      );
    default:
      return <Badge variant="secondary">Không xác định</Badge>;
  }
};

export function AccountTable({
  accounts,
  loading,
  roleFilter,
  selectedIds,
  selectedStatus,
  onSelectedIdsChange,
  onSelectedStatusChange,
  rowActionId,
  onChangeStatus,
  onOpenResetPassword,
  onOpenViewDetail,
  onOpenEdit,
  hasSearched,
}: AccountTableProps) {
  const handleSelectAll = async () => {
    if (!selectedStatus) {
      toast.info("Hãy chọn ít nhất 1 tài khoản để xác định trạng thái");
      return;
    }
    const sameStatusIds = accounts
      .filter((a) => a.status === selectedStatus)
      .map((a) => a.id);
    if (sameStatusIds.length === 0) return;
    const allSelected = sameStatusIds.every((id) => selectedIds.includes(id));
    const ok = await confirmWithToast(
      `${allSelected ? "Bỏ chọn" : "Chọn"} tất cả tài khoản trạng thái '${translateStatus(
        selectedStatus
      )}' trên trang hiện tại?`
    );
    if (!ok) return;
    if (allSelected) {
      const newSelectedIds = selectedIds.filter((id) => !sameStatusIds.includes(id));
      onSelectedIdsChange(newSelectedIds);
      if (newSelectedIds.length === 0) {
        onSelectedStatusChange(null);
      }
    } else {
      onSelectedIdsChange(Array.from(new Set([...selectedIds, ...sameStatusIds])));
    }
  };

  const handleToggleAccount = (account: Account, checked: boolean) => {
    if (checked) {
      if (selectedStatus && selectedStatus !== account.status) {
        toast.error("Chỉ chọn tài khoản có cùng trạng thái");
        return;
      }
      onSelectedIdsChange([...selectedIds, account.id]);
      onSelectedStatusChange(selectedStatus ?? account.status);
    } else {
      const newSelectedIds = selectedIds.filter((id) => id !== account.id);
      onSelectedIdsChange(newSelectedIds);
      if (newSelectedIds.length === 0) {
        onSelectedStatusChange(null);
      }
    }
  };

  return (
    <DataTable
      headers={[
        <div className="flex items-center justify-center gap-2" key="col-select">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-1"
            onClick={handleSelectAll}
            disabled={accounts.length === 0}
          >
            Tất cả
          </Button>
        </div>,
        "Mã số",
        "Họ tên",
        "Vai trò",
        "Email",
        roleFilter === "lecturer"
          ? "Khoa"
          : roleFilter === "student"
            ? "Lớp"
            : "",
        "Trạng thái",
        "Đăng nhập cuối",
        "Thao tác",
      ]}
      maxHeight="auto"
      maxWidth="100%"
    >
      {loading &&
        Array.from({ length: 5 }).map((_, idx) => (
          <tr key={`sk-${idx}`} className="border-b last:border-b-0">
            <td className="px-4 py-2 text-center">
              <Skeleton className="h-4 w-4 mx-auto" />
            </td>
            <td className="px-4 py-2">
              <Skeleton className="h-4 w-[500px]" />
            </td>
            <td className="px-4 py-2">
              <Skeleton className="h-4 w-48" />
            </td>
            <td className="px-4 py-2">
              <Skeleton className="h-4 w-28" />
            </td>
            <td className="px-4 py-2">
              <Skeleton className="h-4 w-64" />
            </td>
            <td className="px-4 py-2">
              <Skeleton className="h-4 w-28" />
            </td>
            <td className="px-4 py-2">
              <Skeleton className="h-6 w-24" />
            </td>
            <td className="px-4 py-2">
              <Skeleton className="h-4 w-40" />
            </td>
            <td className="px-4 py-2">
              <Skeleton className="h-6 w-8 ml-auto" />
            </td>
          </tr>
        ))}

      {!loading &&
        accounts.map((account) => (
          <tr
            key={account.id}
            className="hover:bg-accent/40 transition-colors border-b last:border-b-0"
          >
            <td className="px-4 py-2 text-center">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={selectedIds.includes(account.id)}
                onChange={(e) => handleToggleAccount(account, e.target.checked)}
              />
            </td>
            <td className="px-4 py-2 font-medium text-card-foreground whitespace-nowrap">
              {account.code || account.id}
            </td>
            <td className="px-4 py-2 text-card-foreground min-w-[220px] max-w-[360px] whitespace-normal wrap-break-word">
              {account.name}
            </td>
            <td className="px-4 py-2">
              <span className="text-card-foreground">
                {translateRole(account.role)}
              </span>
            </td>
            <td className="px-4 py-2 text-muted-foreground max-w-[220px] whitespace-normal wrap-break-word">
              {account.email}
            </td>
            {roleFilter === "lecturer" ? (
              <td className="px-4 py-2 text-card-foreground whitespace-nowrap">
                {account.lecturerFacultyName || "-"}
              </td>
            ) : roleFilter === "student" ? (
              <td className="px-4 py-2 text-card-foreground whitespace-nowrap">
                {account.studentClassCode || "-"}
                {account.studentSemesterName
                  ? ` • ${account.studentSemesterName}`
                  : ""}
              </td>
            ) : (
              <td className="px-4 py-2" />
            )}
            <td className="px-4 py-2">{getStatusBadge(account.status)}</td>
            <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
              <span suppressHydrationWarning>
                {account.lastLogin
                  ? new Date(account.lastLogin).toLocaleString("vi-VN")
                  : "Chưa đăng nhập"}
              </span>
            </td>
            <td className="px-4 py-2 text-muted-foreground">
              <AccountRowActions
                accountId={account.id}
                accountName={account.name}
                accountStatus={account.status}
                isBusy={rowActionId === account.id}
                onChangeStatus={onChangeStatus}
                onOpenResetPassword={onOpenResetPassword}
                onOpenViewDetail={onOpenViewDetail}
                onOpenEdit={onOpenEdit}
              />
            </td>
          </tr>
        ))}

      {!loading && accounts.length === 0 && (
        <tr>
          <td
            colSpan={9}
            className="px-4 py-8 text-center text-muted-foreground"
          >
            {hasSearched
              ? "Không có tài khoản nào phù hợp. Hãy thay đổi từ khóa và thử lại."
              : "Nhập điều kiện và nhấn Tìm kiếm để tải danh sách."}
          </td>
        </tr>
      )}
    </DataTable>
  );
}

