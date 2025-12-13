"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountPagination } from "@/components/admin/modals_UI/AccountPagination";
import { AccountStatsSummary } from "@/components/admin/modals_UI/AccountStatsSummary";

declare const process: { env: Record<string, string | undefined> };

import { ResetPasswordModal } from "@/components/admin/modals_UI/ResetPasswordModal";
import { AddUserModal } from "@/components/admin/modals_UI/AddUserModal";
import UserDetailModal from "@/components/admin/modals_UI/UserDetailModal";
import { BulkStatusUpdateModal } from "@/components/admin/modals_UI/BulkStatusUpdateModal";
import { EditUserModal } from "@/components/admin/modals_UI/EditUserModal";
import {
  fetchAccounts,
  updateUserStatus,
  fetchFaculties,
  fetchClasses,
  fetchSemesters,
  getToken,
  type AccountStatus,
  type AccountRole,
} from "@/services/accountManagementService";
import type { Account } from "@/services/accountManagementService";
import { AccountFilters } from "./AccountFilters";
import { AccountTable } from "./AccountTable";
import { AccountTableHeader } from "./AccountTableHeader";

export function AccountManagement() {
  type RoleOption = "all" | "admin" | "lecturer" | "student" | "parent";
  type StatusOption = "all" | "active" | "inactive" | "suspended";

  const [searchInput, setSearchInput] = useState("");

  const [query, setQuery] = useState("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const [roleFilter, setRoleFilter] = useState<RoleOption>("all");
  const [statusFilter, setStatusFilter] = useState<StatusOption>("all");

  const [facultyFilter, setFacultyFilter] = useState<number | "all">("all");
  const [classFilter, setClassFilter] = useState<number | "all">("all");
  const [semesterFilter, setSemesterFilter] = useState<number | "all">("all");

  const [faculties, setFaculties] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [classes, setClasses] = useState<
    Array<{ id: number; class_code: string }>
  >([]);
  const [semesters, setSemesters] = useState<
    Array<{ id: number; name: string }>
  >([]);

  if (typeof window !== "undefined") {
  }
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";


  useEffect(() => {
    let ignore = false;
    async function loadFaculties() {
      try {
        const list = await fetchFaculties(API_BASE);
        if (!ignore) {
          setFaculties(list);
        }
      } catch {
        // ignore
      }
    }
    if (roleFilter === "lecturer" && faculties.length === 0) {
      loadFaculties();
    }
    return () => {
      ignore = true;
    };
  }, [roleFilter, API_BASE, faculties.length]);

  // lấy danh sách lớp khi roleFilter là student
  useEffect(() => {
    let ignore = false;
    async function loadClasses() {
      const token = getToken();
      try {
        const list = await fetchClasses(token, API_BASE);
        if (!ignore) {
          setClasses(list);
        }
      } catch {
        console.log("Failed to load classes");
      }
    }
    if (roleFilter === "student" && classes.length === 0) {
      loadClasses();
    }
    return () => {
      ignore = true;
    };
  }, [roleFilter, API_BASE, classes.length]);

  // lấy danh sách học kỳ khi roleFilter là student
  useEffect(() => {
    let ignore = false;
    async function loadSemesters() {
      const token = getToken();
      try {
        const list = await fetchSemesters(token, API_BASE);
        if (!ignore) {
          setSemesters(list);
        }
      } catch {
      }
    }
    if (roleFilter === "student" && semesters.length === 0) {
      loadSemesters();
    }
    return () => {
      ignore = true;
    };
  }, [roleFilter, API_BASE, semesters.length]);

  // modal đặt lại mật khẩu
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // modal xem chi tiết người dùng
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<{ id: string; name: string } | null>(null);

  // modal sửa thông tin người dùng
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<{ id: string; name: string } | null>(null);

  // modal thêm người dùng
  const [addUserOpen, setAddUserOpen] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rowActionId, setRowActionId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<AccountStatus | null>(null);
  const [bulkUpdateModalOpen, setBulkUpdateModalOpen] = useState(false);

  //  lấy danh sách người dùng với pagination
  const loadAccounts = async (
    nextPage: number,
    nextPageSize: number,
    nextQuery: string,
    nextRole: string = roleFilter,
    nextStatus: string = statusFilter,
    extra?: {
      facultyId?: number | null;
      classId?: number | null;
      semesterId?: number | null;
    }
  ) => {
    const token = getToken();
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAccounts({
        page: nextPage,
        pageSize: nextPageSize,
        search: nextQuery,
        role: nextRole as "all" | AccountRole,
        status: nextStatus as "all" | AccountStatus,
        facultyId: extra?.facultyId,
        classId: extra?.classId,
        semesterId: extra?.semesterId,
        token,
        apiBase: API_BASE,
      });

      setAccounts(result.accounts);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
      setPage(result.pagination.page);
      setPageSize(result.pagination.limit);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Lỗi kết nối máy chủ";
      setError(errorMessage);
      setAccounts([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const currentPage = Math.min(page, totalPages);

  const handleFiltersReset = () => {
    setSearchInput("");
    setQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setFacultyFilter("all");
    setClassFilter("all");
    setSemesterFilter("all");
    setAccounts([]);
    setTotal(0);
    setTotalPages(1);
    setHasSearched(false);
    setSelectedIds([]);
    setSelectedStatus(null);
  };

  const handleFiltersSearch = async () => {
    setHasSearched(true);
    setQuery(searchInput.trim());
    await loadAccounts(1, pageSize, searchInput.trim(), roleFilter, statusFilter, {
      facultyId:
        roleFilter === "lecturer" && facultyFilter !== "all"
          ? Number(facultyFilter)
          : null,
      classId:
        roleFilter === "student" && classFilter !== "all"
          ? Number(classFilter)
          : null,
      semesterId:
        roleFilter === "student" && semesterFilter !== "all"
          ? Number(semesterFilter)
          : null,
    });
  };

  const handleRetry = async () => {
    await loadAccounts(page, pageSize, query);
  };

  const changePage = async (newPage: number) => {
    await loadAccounts(newPage, pageSize, query, roleFilter, statusFilter, {
      facultyId:
        roleFilter === "lecturer" && facultyFilter !== "all"
          ? Number(facultyFilter)
          : null,
      classId:
        roleFilter === "student" && classFilter !== "all"
          ? Number(classFilter)
          : null,
      semesterId:
        roleFilter === "student" && semesterFilter !== "all"
          ? Number(semesterFilter)
          : null,
    });
  };

  const changePageSize = async (newSize: number) => {
    setPageSize(newSize);
    await loadAccounts(1, newSize, query, roleFilter, statusFilter, {
      facultyId:
        roleFilter === "lecturer" && facultyFilter !== "all"
          ? Number(facultyFilter)
          : null,
      classId:
        roleFilter === "student" && classFilter !== "all"
          ? Number(classFilter)
          : null,
      semesterId:
        roleFilter === "student" && semesterFilter !== "all"
          ? Number(semesterFilter)
          : null,
    });
  };


  const changeUserStatus = async (
    accountId: string,
    nextStatus: AccountStatus
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      setRowActionId(accountId);
      setError(null);
      const token = getToken();
      const result = await updateUserStatus(accountId, nextStatus, token, API_BASE);
      
      if (result.ok && result.status) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === accountId ? { ...a, status: result.status! } : a
          )
        );
        return { ok: true };
      } else {
        setError(result.message || "Không thể cập nhật trạng thái người dùng");
        return { ok: false, message: result.message };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi kết nối máy chủ khi cập nhật trạng thái";
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setRowActionId(null);
    }
  };



  const activeCount = accounts.filter((a) => a.status === "active").length;
  const inactiveCount = accounts.filter((a) => a.status === "inactive").length;
  const suspendedCount = accounts.filter(
    (a) => a.status === "suspended"
  ).length;

  return (
    <div className="max-w-full mx-auto py-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Quản lý tài khoản
        </h1>
        <p className="text-muted-foreground">
          Quản lý tài khoản người dùng, phân quyền và theo dõi hoạt động
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <Tabs
          value={roleFilter}
          onValueChange={(v: string) => {
            setRoleFilter(v as RoleOption);
            setFacultyFilter("all");
            setClassFilter("all");
            setSemesterFilter("all");
            setSelectedIds([]);
            setSelectedStatus(null);
            setAccounts([]);
            setTotal(0);
            setTotalPages(1);
            setHasSearched(false);
            setQuery("");
            setSearchInput("");
            setPage(1);
          }}
          className="w-full max-w-fit"
        >
          <TabsList>
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="student">Sinh viên</TabsTrigger>
            <TabsTrigger value="lecturer">Giảng viên</TabsTrigger>
            <TabsTrigger value="parent">Phụ huynh</TabsTrigger>
            <TabsTrigger value="admin">Quản trị</TabsTrigger>
          </TabsList>
        </Tabs>
       
      </div>

      <AccountFilters
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onSearch={handleFiltersSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        roleFilter={roleFilter}
        facultyFilter={facultyFilter}
        onFacultyFilterChange={setFacultyFilter}
        classFilter={classFilter}
        onClassFilterChange={setClassFilter}
        faculties={faculties}
        classes={classes}
        loading={loading}
        onReset={handleFiltersReset}
        onAddUser={() => setAddUserOpen(true)}
      />

      <Card className="bg-card border-border">
        <AccountTableHeader
          selectedIds={selectedIds}
          onBulkUpdateClick={() => setBulkUpdateModalOpen(true)}
        />
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 text-red-400 px-4 py-3 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">Không thể tải dữ liệu</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
              <Button
                variant="outline"
                className="border-red-500/40 text-red-300 hover:bg-red-500/10"
                onClick={() => {
                  setError(null);
                  handleRetry();
                }}
              >
                Thử lại
              </Button>
            </div>
          )}
          <AccountTable
            accounts={accounts}
            loading={loading}
            roleFilter={roleFilter}
            selectedIds={selectedIds}
            selectedStatus={selectedStatus}
            onSelectedIdsChange={setSelectedIds}
            onSelectedStatusChange={setSelectedStatus}
            rowActionId={rowActionId}
                      onChangeStatus={changeUserStatus}
                      onOpenResetPassword={(id, name) => {
                        setSelectedUser({ id, name });
                        setResetOpen(true);
                      }}
                      onOpenViewDetail={(id, name) => {
                        setDetailUser({ id, name });
                        setDetailOpen(true);
                      }}
                      onOpenEdit={(id, name) => {
                        setEditUser({ id, name });
                        setEditOpen(true);
                      }}
            hasSearched={hasSearched}
          />

          {/* Pagination */}
          {total > 0 && (
            <AccountPagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              pageSize={pageSize}
              onChangePageSize={async (v) => changePageSize(v)}
              onChangePage={async (p) => changePage(p)}
            />
          )}
          <AccountStatsSummary
            active={activeCount}
            inactive={inactiveCount}
            suspended={suspendedCount}
          />
        </CardContent>
      </Card>
      {/* Modal đặt lại mật khẩu */}
      <ResetPasswordModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        userId={selectedUser?.id || null}
        userName={selectedUser?.name}
        onSuccess={() => {
          toast.success("Đặt lại mật khẩu thành công!");
        }}
      />
      {/* Modal thêm người dùng */}
      <AddUserModal
        open={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        onSuccess={() => {
          toast.success("Tạo tài khoản mới thành công!");
          loadAccounts(page, pageSize, query); 
        }}
      />
      {/* Modal xem chi tiết người dùng */}
      <UserDetailModal
        open={detailOpen}
        userId={detailUser?.id || null}
        onClose={() => setDetailOpen(false)}
      />
      {/* Modal cập nhật trạng thái hàng loạt */}
      <BulkStatusUpdateModal
        open={bulkUpdateModalOpen}
        onClose={() => setBulkUpdateModalOpen(false)}
        selectedIds={selectedIds}
        currentStatus={selectedStatus}
        onSuccess={(successIds, newStatus) => {
          setAccounts((prev) =>
            prev.map((a) =>
              successIds.includes(a.id) ? { ...a, status: newStatus } : a
            )
          );
          setSelectedIds([]);
          setSelectedStatus(null);
        }}
        apiBase={API_BASE}
      />
      {/* Modal sửa thông tin tài khoản */}
      <EditUserModal
        open={editOpen}
        userId={editUser?.id || null}
        onClose={() => {
          setEditOpen(false);
          setEditUser(null);
        }}
        onSuccess={() => {
          toast.success("Cập nhật thông tin thành công!");
          loadAccounts(page, pageSize, query, roleFilter, statusFilter, {
            facultyId:
              roleFilter === "lecturer" && facultyFilter !== "all"
                ? Number(facultyFilter)
                : null,
            classId:
              roleFilter === "student" && classFilter !== "all"
                ? Number(classFilter)
                : null,
            semesterId:
              roleFilter === "student" && semesterFilter !== "all"
                ? Number(semesterFilter)
                : null,
          });
        }}
      />
    </div>
  );
}
