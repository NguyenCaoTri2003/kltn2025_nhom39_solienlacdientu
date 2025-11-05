"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { translateRole, translateStatus } from "@packages/utils/translations";
import { confirmWithToast } from "@/components/ui/confirm-with-toast";
import { AccountRowActions } from "@/components/admin/modals_UI/AccountRowActions";
import { AccountPagination } from "@/components/admin/modals_UI/AccountPagination";
import { AccountStatsSummary } from "@/components/admin/modals_UI/AccountStatsSummary";

declare const process: { env: Record<string, string | undefined> };
import type { ChangeEvent, KeyboardEvent } from "react";

import { ResetPasswordModal } from "@/components/admin/modals_UI/ResetPasswordModal";
import { AddUserModal } from "@/components/admin/modals_UI/AddUserModal";
import UserDetailModal from "@/components/admin/modals_UI/UserDetailModal";

interface Account {
  id: string;
  code?: string;
  name: string;
  role: "admin" | "lecturer" | "student" | "parent";
  status: "active" | "inactive" | "suspended";
  lastLogin: string | null;
  email: string;

  lecturerFacultyName?: string | null;
  studentClassCode?: string | null;
  studentSemesterName?: string | null;
}

type ApiUser = {
  id: number | string;
  full_name: string;
  email: string;
  role: Account["role"] | string;
  status: Account["status"] | string;
  last_login?: string | null;
  _code?: string | null;
  lecturer?: { faculty_name?: string | null } | null;
  student?: {
    class_code?: string | null;
    current_semester_name?: string | null;
  } | null;
};

type ApiPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

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
        const res = await fetch(`${API_BASE}/api/faculties`, {
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!ignore && res.ok && Array.isArray(json?.data)) {
          const list = json.data as Array<{ id: number; name: string }>;
          setFaculties(list.map((f) => ({ id: f.id, name: f.name })));
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

  // Fetch classes when roleFilter is student
  useEffect(() => {
    let ignore = false;
    async function loadClasses() {
      try {
        const res = await fetch(`${API_BASE}/api/classes`, {
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!ignore && res.ok && Array.isArray(json?.data)) {
          const list = json.data as Array<{ id: number; class_code: string }>;
          setClasses(list.map((c) => ({ id: c.id, class_code: c.class_code })));
        }
      } catch {
        // ignore
      }
    }
    if (roleFilter === "student" && classes.length === 0) {
      loadClasses();
    }
    return () => {
      ignore = true;
    };
  }, [roleFilter, API_BASE, classes.length]);

  // Fetch semesters when roleFilter is student
  useEffect(() => {
    let ignore = false;
    async function loadSemesters() {
      try {
        const res = await fetch(`${API_BASE}/api/semesters`, {
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!ignore && res.ok && Array.isArray(json?.data)) {
          const list = json.data as Array<{ id: number; name: string }>;
          setSemesters(list.map((s) => ({ id: s.id, name: s.name })));
        }
      } catch {
        // ignore
      }
    }
    if (roleFilter === "student" && semesters.length === 0) {
      loadSemesters();
    }
    return () => {
      ignore = true;
    };
  }, [roleFilter, API_BASE, semesters.length]);

  // Model reset password
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Modal view detail
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<{ id: string; name: string } | null>(null);

  // Model add user
  const [addUserOpen, setAddUserOpen] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [rowActionId, setRowActionId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<
    Account["status"] | null
  >(null);
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);
  const [bulkTargetStatus, setBulkTargetStatus] =
    useState<Account["status"]>("inactive");



  // Hàm gọi API server-side pagination
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
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("limit", String(nextPageSize));
      if (nextQuery) params.set("search", nextQuery);
      if (nextRole && nextRole !== "all") params.set("role", nextRole);
      if (nextStatus && nextStatus !== "all") params.set("status", nextStatus);
      if (extra?.facultyId) params.set("faculty_id", String(extra.facultyId));
      if (extra?.classId) params.set("class_id", String(extra.classId));
      if (extra?.semesterId)
        params.set("semester_id", String(extra.semesterId));
      const res = await fetch(`${API_BASE}/api/users?${params.toString()}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await res.json().catch(() => ({}));
      if (
        res.ok &&
        result.returnCode === 0 &&
        Array.isArray(result.data?.users)
      ) {
        const pag: ApiPagination | undefined = result.data?.pagination;
        const mapped = (result.data.users as ApiUser[]).map(
          (u: ApiUser): Account => ({
            id: String(u.id),
            code: u._code ?? undefined,
            name: u.full_name,
            role: u.role as Account["role"],
            status: u.status as Account["status"],
            email: u.email,
            lastLogin: u.last_login ?? null,
            lecturerFacultyName: u.lecturer?.faculty_name ?? null,
            studentClassCode: u.student?.class_code ?? null,
            studentSemesterName: u.student?.current_semester_name ?? null,
          })
        );
        setAccounts(mapped);
        if (pag) {
          setTotal(pag.total);
          setTotalPages(pag.totalPages);
          setPage(pag.page);
          setPageSize(pag.limit);
        } else {
          setTotal(mapped.length);
          setTotalPages(1);
        }
      } else {
        if (res.status === 401)
          setError("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn (401)");
        else if (res.status === 403)
          setError("Bạn không có quyền truy cập tài nguyên này (403)");
        else setError(result.message || "Không thể tải danh sách người dùng");
        setAccounts([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
      setAccounts([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const currentPage = Math.min(page, totalPages);
  // startIndex không còn dùng để tính hiển thị local

  const handleSearch = async () => {
    setHasSearched(true);
    const nextQuery = searchInput.trim();
    setQuery(nextQuery);
    await loadAccounts(1, pageSize, nextQuery, roleFilter, statusFilter, {
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
    nextStatus: Account["status"]
  ): Promise<{ ok: boolean; message?: string }> => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    try {
      setRowActionId(accountId);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/users/${accountId}/status`, {
        method: "PATCH",
        // credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result?.returnCode === 0) {
        const updatedStatus: Account["status"] =
          result?.data?.status || nextStatus;
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === accountId ? { ...a, status: updatedStatus } : a
          )
        );
        return { ok: true };
      } else {
        let msg = "Không thể cập nhật trạng thái người dùng";
        if (res.status === 401)
          msg = "Bạn chưa đăng nhập hoặc phiên đã hết hạn (401)";
        else if (res.status === 403)
          msg = "Bạn không có quyền cập nhật trạng thái (403)";
        else if (result?.message) msg = result.message;
        setError(msg);
        return { ok: false, message: msg };
      }
    } catch {
      const msg = "Lỗi kết nối máy chủ khi cập nhật trạng thái";
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setRowActionId(null);
    }
  };

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

  // Đã bỏ icon vai trò để gọn giao diện danh sách

  const activeCount = accounts.filter((a) => a.status === "active").length;
  const inactiveCount = accounts.filter((a) => a.status === "inactive").length;
  const suspendedCount = accounts.filter(
    (a) => a.status === "suspended"
  ).length;

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Quản lý tài khoản
        </h1>
        <p className="text-muted-foreground">
          Quản lý tài khoản người dùng, phân quyền và theo dõi hoạt động
        </p>
      </div>

      {/* Role Tabs on top (left) and Add-user on right */}
      <div className="flex items-center justify-between mb-3">
        <Tabs
          value={roleFilter}
          onValueChange={(v: string) => {
            setRoleFilter(v as RoleOption);
            // Reset extra filters and selection when switching role
            setFacultyFilter("all");
            setClassFilter("all");
            setSemesterFilter("all");
            setSelectedIds([]);
            setSelectedStatus(null);
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
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => setAddUserOpen(true)}
        >
          Thêm tài khoản
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="bg-card border-border mb-6">
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Bộ lọc tìm kiếm
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Tìm kiếm theo từ khóa, vai trò, trạng thái và điều kiện nâng cao
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Grid fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label className="mb-1 block">Từ khóa</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nhập tên, email, số điện thoại hoặc mã số..."
                    value={searchInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSearchInput(e.target.value)
                    }
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                    className="pl-10 bg-input border-border"
                  />
                </div>
              </div>
              <div>
                <Label className="mb-1 block">Trạng thái</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v: string) =>
                    setStatusFilter(v as StatusOption)
                  }
                >
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue placeholder="Lọc theo trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Bị khóa</SelectItem>
                    <SelectItem value="suspended">Chờ kích hoạt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                {roleFilter === "lecturer" && (
                  <div>
                    <Label className="mb-1 block">Khoa</Label>
                    <Select
                      value={
                        facultyFilter === "all" ? "all" : String(facultyFilter)
                      }
                      onValueChange={(v: string) =>
                        setFacultyFilter(v === "all" ? "all" : Number(v))
                      }
                    >
                      <SelectTrigger className="bg-input border-border">
                        <SelectValue placeholder="Chọn khoa" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border max-h-60">
                        <SelectItem value="all">Tất cả khoa</SelectItem>
                        {faculties.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {roleFilter === "student" && (
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="mb-1 block">Lớp</Label>
                      <Select
                        value={
                          classFilter === "all" ? "all" : String(classFilter)
                        }
                        onValueChange={(v: string) =>
                          setClassFilter(v === "all" ? "all" : Number(v))
                        }
                      >
                        <SelectTrigger className="bg-input border-border">
                          <SelectValue placeholder="Chọn lớp" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border max-h-60">
                          <SelectItem value="all">Tất cả lớp</SelectItem>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.class_code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </div>
                )}
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
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
                }}
              >
                Đặt lại
              </Button>
              <Button
                onClick={async () => {
                  setHasSearched(true);
                  setQuery(searchInput.trim());
                  await loadAccounts(
                    1,
                    pageSize,
                    searchInput.trim(),
                    roleFilter,
                    statusFilter,
                    {
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
                    }
                  );
                }}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Tìm kiếm
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Management Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-card-foreground">
                Danh sách tài khoản
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Quản lý tất cả tài khoản trong hệ thống
              </CardDescription>
            </div>
            {/* Bulk status updater moved here for better UX */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Cập nhật trạng thái:
              </span>
              <Select
                value={bulkTargetStatus}
                onValueChange={(v: string) =>
                  setBulkTargetStatus(v as Account["status"])
                }
              >
                <SelectTrigger className="w-[160px] bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Bị khóa</SelectItem>
                  <SelectItem value="suspended">Chờ kích hoạt</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                disabled={
                  bulkLoading ||
                  selectedIds.length === 0 ||
                  (selectedStatus !== null &&
                    bulkTargetStatus === selectedStatus)
                }
                onClick={async () => {
                  if (selectedIds.length === 0) return;
                  if (
                    selectedStatus !== null &&
                    bulkTargetStatus === selectedStatus
                  ) {
                    toast.info("Hãy chọn trạng thái khác hiện tại");
                    return;
                  }
                  const ok = await confirmWithToast(
                    `Cập nhật ${selectedIds.length
                    } tài khoản sang trạng thái '${translateStatus(
                      bulkTargetStatus
                    )}'?`
                  );
                  if (!ok) return;
                  setBulkLoading(true);
                  try {
                    const API_BASE =
                      process.env.NEXT_PUBLIC_API_URL ||
                      "http://localhost:3000";
                    const results = await Promise.allSettled(
                      selectedIds.map((id) =>
                        fetch(`${API_BASE}/api/users/${id}/status`, {
                          method: "PATCH",
                          credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: bulkTargetStatus }),
                        }).then(async (r) => ({
                          ok: r.ok,
                          json: await r.json().catch(() => ({})),
                        }))
                      )
                    );
                    const successIds: string[] = [];
                    const failed: number = results.reduce((acc, res, idx) => {
                      if (
                        res.status === "fulfilled" &&
                        res.value.ok &&
                        res.value.json?.returnCode === 0
                      ) {
                        successIds.push(selectedIds[idx]);
                        return acc;
                      }
                      return acc + 1;
                    }, 0);

                    if (successIds.length > 0) {
                      setAccounts((prev) =>
                        prev.map((a) =>
                          successIds.includes(a.id)
                            ? { ...a, status: bulkTargetStatus }
                            : a
                        )
                      );
                    }
                    if (failed > 0)
                      toast.error(`Cập nhật thất bại ${failed} tài khoản`);
                    if (successIds.length > 0)
                      toast.success(
                        `Đã cập nhật ${successIds.length} tài khoản`
                      );
                    setSelectedIds([]);
                    setSelectedStatus(null);
                  } catch {
                    toast.error("Có lỗi khi cập nhật trạng thái hàng loạt");
                  } finally {
                    setBulkLoading(false);
                  }
                }}
              >
                {bulkLoading ? "Đang cập nhật..." : "Áp dụng"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error banner */}
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
          <DataTable
            headers={[
              // Header with button to select all by current selectedStatus
              <div
                className="flex items-center justify-center gap-2"
                key="col-select"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-1"
                  onClick={async () => {
                    if (!selectedStatus) {
                      toast.info(
                        "Hãy chọn ít nhất 1 tài khoản để xác định trạng thái"
                      );
                      return;
                    }
                    const sameStatusIds = accounts
                      .filter((a) => a.status === selectedStatus)
                      .map((a) => a.id);
                    if (sameStatusIds.length === 0) return;
                    const allSelected = sameStatusIds.every((id) =>
                      selectedIds.includes(id)
                    );
                    const ok = await confirmWithToast(
                      `${allSelected ? "Bỏ chọn" : "Chọn"
                      } tất cả tài khoản trạng thái '${translateStatus(
                        selectedStatus
                      )}' trên trang hiện tại?`
                    );
                    if (!ok) return;
                    if (allSelected) {
                      setSelectedIds((prev) =>
                        prev.filter((id) => !sameStatusIds.includes(id))
                      );
                      setTimeout(() => {
                        const remaining = selectedIds.filter(
                          (id) => !sameStatusIds.includes(id)
                        );
                        if (remaining.length === 0) setSelectedStatus(null);
                      }, 0);
                    } else {
                      setSelectedIds((prev) =>
                        Array.from(new Set([...prev, ...sameStatusIds]))
                      );
                    }
                  }}
                  disabled={bulkLoading || accounts.length === 0}
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
                  {/* Extra column skeleton for role-specific info */}
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
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (
                            selectedStatus &&
                            selectedStatus !== account.status
                          ) {
                            toast.error(
                              "Chỉ chọn tài khoản có cùng trạng thái"
                            );
                            return;
                          }
                          setSelectedIds((prev) => [...prev, account.id]);
                          setSelectedStatus((prev) => prev ?? account.status);
                        } else {
                          setSelectedIds((prev) =>
                            prev.filter((id) => id !== account.id)
                          );

                          setTimeout(() => {
                            if (
                              selectedIds.filter((id) => id !== account.id)
                                .length === 0
                            ) {
                              setSelectedStatus(null);
                            }
                          }, 0);
                        }
                      }}
                      disabled={bulkLoading}
                    />
                  </td>
                  <td className="px-4 py-2 font-medium text-card-foreground whitespace-nowrap">
                    {account.code || account.id}
                  </td>
                  <td className="px-4 py-2 text-card-foreground min-w-[220px] max-w-[360px] whitespace-normal break-words">
                    {account.name}
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-card-foreground">
                      {translateRole(account.role)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground max-w-[220px] whitespace-normal break-words">
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
                  <td className="px-4 py-2">
                    {getStatusBadge(account.status)}
                  </td>
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
                      onChangeStatus={changeUserStatus}
                      onOpenResetPassword={(id, name) => {
                        setSelectedUser({ id, name });
                        setResetOpen(true);
                      }}
                      onOpenViewDetail={(id, name) => {
                        setDetailUser({ id, name });
                        setDetailOpen(true);
                      }}
                    />
                  </td>
                </tr>
              ))}

            {!loading && total === 0 && (
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
          loadAccounts(page, pageSize, query); // reload danh sách
        }}
      />
      {/* Modal xem chi tiết người dùng */}
      <UserDetailModal
        open={detailOpen}
        userId={detailUser?.id || null}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
