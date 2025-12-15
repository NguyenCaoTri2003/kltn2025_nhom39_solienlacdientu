"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { getAllAdminPermissions, type AdminUser, type AdminType } from "@/services/adminPermissionService";
import {
  updateUserStatus,
  getToken,
  type AccountStatus,
} from "@/services/accountManagementService";
import { CreateAdminModal } from "./CreateAdminModal";
import { AssignPermissionModal } from "./AssignPermissionModal";
import { AdminPermissionsFilters } from "./AdminPermissionsFilters";
import { AdminPermissionsTable } from "./AdminPermissionsTable";
import { AccountPagination } from "@/components/admin/modals_UI/AccountPagination";

type AdminTypeOption = "all" | AdminType;

interface AdminPermissionsManagementProps {
  currentAdminId?: number | null;
  currentAdminType?: AdminType | null;
}

export function AdminPermissionsManagement({
  currentAdminId,
  currentAdminType,
}: AdminPermissionsManagementProps) {
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<{ id: number; name: string } | null>(null);

  // Search và filter states
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [adminTypeFilter, setAdminTypeFilter] = useState<AdminTypeOption>("all");
  const [hasSearched, setHasSearched] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const result = await getAllAdminPermissions({
        search: query || undefined,
        adminType: adminTypeFilter === "all" ? undefined : adminTypeFilter,
        page,
        pageSize,
      });
      setAdmins(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setHasSearched(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách admin";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setQuery(searchInput);
    setPage(1);
    loadAdmins();
  };

  const handleReset = () => {
    setSearchInput("");
    setQuery("");
    setAdminTypeFilter("all");
    setPage(1);
    setPageSize(20);
    setHasSearched(false);
    setAdmins([]);
    setTotal(0);
    setTotalPages(1);
  };

  const handleAssignPermission = (admin: AdminUser) => {
    setSelectedAdmin({ id: admin.id, name: admin.full_name });
    setAssignModalOpen(true);
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    // Không cho phép super_admin tự khóa tài khoản của chính mình
    if (currentAdminType === "super_admin" && currentAdminId === admin.id) {
      toast.error("Bạn không thể tự khóa tài khoản của chính mình.");
      return;
    }
    try {
      const token = getToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL || window.location.origin;

      const nextStatus: AccountStatus =
        admin.status === "inactive" ? "active" : "inactive";

      const result = await updateUserStatus(
        String(admin.id),
        nextStatus,
        token,
        apiBase
      );

      if (!result.ok) {
        toast.error(result.message || "Không thể cập nhật trạng thái tài khoản");
        return;
      }

      toast.success(
        nextStatus === "inactive"
          ? "Đã khóa tài khoản admin này."
          : "Đã mở khóa tài khoản admin này."
      );
      // Reload danh sách để cập nhật trạng thái
      loadAdmins();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể cập nhật trạng thái tài khoản";
      toast.error(message);
    }
  };

  const changePage = async (newPage: number) => {
    setPage(newPage);
  };

  const changePageSize = async (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  useEffect(() => {
    if (hasSearched || query) {
      loadAdmins();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, query, adminTypeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Phân quyền quản trị</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý tài khoản quản trị viên hệ thống
        </p>
      </div>

      <AdminPermissionsFilters
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleSearch}
        adminTypeFilter={adminTypeFilter}
        onAdminTypeFilterChange={setAdminTypeFilter}
        loading={loading}
        onReset={handleReset}
        onCreateAdmin={() => setCreateModalOpen(true)}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Danh sách Quản trị viên
          </CardTitle>
          <CardDescription>
            Quản lý tất cả tài khoản quản trị viên trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminPermissionsTable
            admins={admins}
            loading={loading}
            onAssignPermission={handleAssignPermission}
            onToggleStatus={handleToggleStatus}
            hasSearched={hasSearched}
          />

          {total > 0 && (
            <AccountPagination
              currentPage={page}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onChangePageSize={changePageSize}
              onChangePage={changePage}
              disabled={loading}
            />
          )}
        </CardContent>
      </Card>

      <CreateAdminModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          loadAdmins();
        }}
      />

      <AssignPermissionModal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setSelectedAdmin(null);
        }}
        userId={selectedAdmin?.id || null}
        userName={selectedAdmin?.name || ""}
        onSuccess={() => {
          loadAdmins();
        }}
      />
    </div>
  );
}

