"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminUser, AdminType } from "@/services/adminPermissionService";

type AdminTypeKey = Exclude<AdminType, null | undefined>;

const ADMIN_TYPE_LABELS: Record<AdminTypeKey | "none", string> = {
  none: "Chưa phân quyền",
  super_admin: "Toàn quyền Quản trị",
  admin_account: "Quản trị Tài khoản",
  admin_academic: "Quản trị Học vụ",
  admin_finance: "Quản trị Tài chính",
  admin: "Quản trị viên (admin)",
};

const ADMIN_TYPE_COLORS: Record<AdminTypeKey | "none", string> = {
  none: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  super_admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  admin_account: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  admin_academic: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  admin_finance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  admin: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
};

interface AdminPermissionsTableProps {
  admins: AdminUser[];
  loading: boolean;
  onAssignPermission: (admin: AdminUser) => void;
  onToggleStatus: (admin: AdminUser) => void;
  hasSearched: boolean;
}

export function AdminPermissionsTable({
  admins,
  loading,
  onAssignPermission,
  onToggleStatus,
  hasSearched,
}: AdminPermissionsTableProps) {
  return (
    <DataTable
      headers={["Họ tên", "Email", "Loại quyền", "Trạng thái", "Thao tác"]}
      maxHeight="auto"
      maxWidth="100%"
    >
      {loading &&
        Array.from({ length: 5 }).map((_, idx) => (
          <tr key={`sk-${idx}`} className="border-b last:border-b-0">
            <td className="px-4 py-2">
              <Skeleton className="h-4 w-48" />
            </td>
            <td className="px-4 py-2">
              <Skeleton className="h-4 w-64" />
            </td>
            <td className="px-4 py-2">
              <Skeleton className="h-6 w-32" />
            </td>
            <td className="px-4 py-2">
              <Skeleton className="h-6 w-8 ml-auto" />
            </td>
          </tr>
        ))}

      {!loading &&
        admins.map((admin) => {
          const typeKey: AdminTypeKey | "none" =
            admin.admin_type == null ? "none" : admin.admin_type;
          return (
            <tr
              key={admin.id}
              className="hover:bg-accent/40 transition-colors border-b last:border-b-0"
            >
              <td className="px-4 py-2 text-card-foreground min-w-[220px] max-w-[360px] whitespace-normal">
                {admin.full_name}
              </td>
              <td className="px-4 py-2 text-muted-foreground max-w-[220px] whitespace-normal">
                {admin.email}
              </td>
              <td className="px-4 py-2">
                <Badge className={ADMIN_TYPE_COLORS[typeKey]}>
                  {ADMIN_TYPE_LABELS[typeKey]}
                </Badge>
              </td>
              <td className="px-4 py-2">
                <Badge
                  className={
                    admin.status === "inactive"
                      ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100"
                      : admin.status === "suspended"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-100"
                  }
                >
                  {admin.status === "inactive"
                    ? "Đã khóa"
                    : admin.status === "suspended"
                    ? "Chờ kích hoạt"
                    : "Đang hoạt động"}
                </Badge>
              </td>
              <td className="px-4 py-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border min-w-52">
                    <DropdownMenuItem
                      className="text-popover-foreground hover:bg-accent"
                      onClick={() => onAssignPermission(admin)}
                    >
                      Phân quyền
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-popover-foreground hover:bg-accent"
                      onClick={() => onToggleStatus(admin)}
                    >
                      {admin.status === "inactive" ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          );
        })}

      {!loading && admins.length === 0 && (
        <tr>
          <td
            colSpan={4}
            className="px-4 py-8 text-center text-muted-foreground"
          >
            {hasSearched
              ? "Không có admin nào phù hợp. Hãy thay đổi từ khóa và thử lại."
              : "Nhập điều kiện và nhấn Tìm kiếm để tải danh sách."}
          </td>
        </tr>
      )}
    </DataTable>
  );
}

