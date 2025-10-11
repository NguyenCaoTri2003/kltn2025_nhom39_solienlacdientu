"use client";

import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  UserCheck,
  UserX,
  Clock,
  MoreHorizontal,
  Eye,
  Pencil,
  Lock,
  Unlock,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  FileClock,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { translateRole, translateStatus } from "@packages/utils/translations";
// Allow using process.env in client without Node types
declare const process: { env: Record<string, string | undefined> };
import type { ChangeEvent, KeyboardEvent } from "react";

interface Account {
  id: string;
  code?: string;
  name: string;
  role: "admin" | "lecturer" | "student" | "parent";
  status: "active" | "inactive" | "suspended";
  lastLogin: string | null;
  email: string;
}

// Phản hồi API từ BE
type ApiUser = {
  id: number | string;
  full_name: string;
  email: string;
  role: Account["role"] | string;
  status: Account["status"] | string;
  last_login?: string | null;
  _code?: string | null;
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
  // Từ khóa người dùng nhập
  const [searchInput, setSearchInput] = useState("");
  // Từ khóa đã áp dụng để gọi API
  const [query, setQuery] = useState("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  // Bộ lọc role/status
  const [roleFilter, setRoleFilter] = useState<RoleOption>("all");
  const [statusFilter, setStatusFilter] = useState<StatusOption>("all");

  

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Loading state for a row action (status change)
  const [rowActionId, setRowActionId] = useState<string | null>(null);
  // Hàm gọi API server-side pagination
  const loadAccounts = async (
    nextPage: number,
    nextPageSize: number,
    nextQuery: string,
    nextRole: string = roleFilter,
    nextStatus: string = statusFilter
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
      const res = await fetch(`${API_BASE}/api/users?${params.toString()}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result.returnCode === 0 && Array.isArray(result.data?.users)) {
        const pag: ApiPagination | undefined = result.data?.pagination;
        const mapped = (result.data.users as ApiUser[]).map((u: ApiUser): Account => ({
          id: String(u.id),
          code: u._code ?? undefined,
          name: u.full_name,
          role: u.role as Account["role"],
          status: u.status as Account["status"],
          email: u.email,
          lastLogin: u.last_login ?? null,
        }));
        setAccounts(mapped);
        if (pag) {
          setTotal(pag.total);
          setTotalPages(pag.totalPages);
          setPage(pag.page);
          setPageSize(pag.limit);
        } else {
          // Fallback nếu BE không trả pagination
          setTotal(mapped.length);
          setTotalPages(1);
        }
      } else {
        if (res.status === 401) setError("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn (401)");
        else if (res.status === 403) setError("Bạn không có quyền truy cập tài nguyên này (403)");
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
    await loadAccounts(1, pageSize, nextQuery);
  };

  const handleRetry = async () => {
    await loadAccounts(page, pageSize, query);
  };

  const changePage = async (newPage: number) => {
    await loadAccounts(newPage, pageSize, query);
  };

  const changePageSize = async (newSize: number) => {
    setPageSize(newSize);
    await loadAccounts(1, newSize, query);
  };

  // Call API to change status and update local state
  const changeUserStatus = async (accountId: string, nextStatus: Account["status"]) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    try {
      setRowActionId(accountId);
      setError(null);
      const res = await fetch(`${API_BASE}/api/users/${accountId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result?.returnCode === 0) {
        const updatedStatus: Account["status"] = result?.data?.status || nextStatus;
        setAccounts((prev) =>
          prev.map((a) => (a.id === accountId ? { ...a, status: updatedStatus } : a))
        );
      } else {
        if (res.status === 401) setError("Bạn chưa đăng nhập hoặc phiên đã hết hạn (401)");
        else if (res.status === 403) setError("Bạn không có quyền cập nhật trạng thái (403)");
        else setError(result?.message || "Không thể cập nhật trạng thái người dùng");
      }
    } catch {
      setError("Lỗi kết nối máy chủ khi cập nhật trạng thái");
    } finally {
      setRowActionId(null);
    }
  };

  // ⚙️ Dùng translateStatus trong Badge
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tài khoản hoạt động
                </p>
                <p className="text-2xl font-bold text-green-400">
                  {activeCount}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tài khoản bị khóa
                </p>
                <p className="text-2xl font-bold text-red-400">
                  {inactiveCount}
                </p>
              </div>
              <UserX className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Chờ kích hoạt
                </p>
                <p className="text-2xl font-bold text-yellow-400">
                  {suspendedCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

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
            <div className="flex items-center gap-2 flex-wrap">
              {/* Ô tìm kiếm */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nhập tên, email, số điện thoại hoặc mã số..."
                  value={searchInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  className="pl-10 w-80 bg-input border-border"
                />
              </div>

              {/* Bộ lọc vai trò */}
              <Select value={roleFilter} onValueChange={(v: string) => setRoleFilter(v as RoleOption)}>
                <SelectTrigger className="w-[160px] bg-input border-border">
                  <SelectValue placeholder="Lọc theo vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="student">Sinh viên</SelectItem>
                  <SelectItem value="lecturer">Giảng viên</SelectItem>
                  <SelectItem value="parent">Phụ huynh</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>

              {/* Bộ lọc trạng thái */}
              <Select value={statusFilter} onValueChange={(v: string) => setStatusFilter(v as StatusOption)}>
                <SelectTrigger className="w-[160px] bg-input border-border">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Bị khóa</SelectItem>
                  <SelectItem value="suspended">Chờ kích hoạt</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => { setSearchInput(""); setQuery(""); setRoleFilter("all"); setStatusFilter("all"); setAccounts([]); setTotal(0); setTotalPages(1); setHasSearched(false); }}>
                Đặt lại
              </Button>

              <Button onClick={async () => { setHasSearched(true); setQuery(searchInput.trim()); await loadAccounts(1, pageSize, searchInput.trim()); }} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Tìm kiếm
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
                onClick={() => { setError(null); handleRetry(); }}
              >
                Thử lại
              </Button>
            </div>
          )}
         <div className="rounded-md border border-border overflow-hidden">
  <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
  <Table className="min-w-[800px]">
      <TableHeader>
        <TableRow className="border-border sticky top-0 bg-card z-10">
          <TableHead className="text-muted-foreground w-[50px] text-center">STT</TableHead>
          <TableHead className="text-muted-foreground">Mã số</TableHead>
          <TableHead className="text-muted-foreground text-center">Họ tên</TableHead>
          <TableHead className="text-muted-foreground">Vai trò</TableHead>
          <TableHead className="text-muted-foreground w-[100px] text-center">Email</TableHead>
          <TableHead className="text-muted-foreground">Trạng thái</TableHead>
          <TableHead className="text-muted-foreground">Đăng nhập cuối</TableHead>
          <TableHead className="text-muted-foreground sticky right-0 bg-card z-20 border-l border-border">Thao tác</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {loading && (
          <>
            {Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={`sk-${idx}`} className="border-border">
                <TableCell className="w-[70px] text-center">
                  <Skeleton className="h-4 w-8 mx-auto" />
                </TableCell>
                <TableCell className="w-[120px]">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-64" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell className="sticky right-0 bg-card z-10 border-l border-border">
                  <Skeleton className="h-6 w-8 ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </>
        )}

  {accounts.map((account, idx) => (
          <TableRow
            key={account.id}
            className="border-border hover:bg-accent/40 transition-colors"
          >
            <TableCell className="text-center text-card-foreground">
              {(page - 1) * pageSize + idx + 1}
            </TableCell>
            <TableCell className="font-medium text-card-foreground">
              {account.code || account.id}
            </TableCell>

            <TableCell className="text-card-foreground">
              {account.name}
            </TableCell>

            <TableCell>
              <div className="flex items-center space-x-2">

                <span className="text-card-foreground">
                  {translateRole(account.role)}
                </span>
              </div>
            </TableCell>

            <TableCell className="text-muted-foreground max-w-[200px] whitespace-normal break-words">
              {account.email}
            </TableCell>

            <TableCell>{getStatusBadge(account.status)}</TableCell>

            <TableCell className="text-muted-foreground">
              <span suppressHydrationWarning>
                {account.lastLogin ? new Date(account.lastLogin).toLocaleString("vi-VN") : "Chưa đăng nhập"}
              </span>
            </TableCell>

            <TableCell className="sticky right-0 bg-card z-10 border-l border-border">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={rowActionId === account.id}>
                    {rowActionId === account.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="bg-popover border-border min-w-48"
                >
                  <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                    <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                    <Pencil className="w-4 h-4 mr-2" /> Chỉnh sửa
                  </DropdownMenuItem>

                  {account.status === "active" ? (
                    <DropdownMenuItem
                      className="text-red-400 hover:bg-accent"
                      onClick={async () => {
                        const ok = window.confirm("Bạn có chắc muốn khóa tài khoản này?");
                        if (!ok) return;
                        await changeUserStatus(account.id, "inactive");
                      }}
                      disabled={rowActionId === account.id}
                    >
                      <Lock className="w-4 h-4 mr-2" /> Khóa tài khoản
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="text-green-400 hover:bg-accent"
                      onClick={async () => {
                        const ok = window.confirm("Kích hoạt tài khoản này?");
                        if (!ok) return;
                        await changeUserStatus(account.id, "active");
                      }}
                      disabled={rowActionId === account.id}
                    >
                      <Unlock className="w-4 h-4 mr-2" /> Kích hoạt tài khoản
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                    <FileClock className="w-4 h-4 mr-2" /> Lịch sử đăng nhập
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}

        {total === 0 && (
          <TableRow>
            <TableCell
              colSpan={8}
              className="text-center text-muted-foreground py-8"
            >
              {loading
                ? "Đang tải dữ liệu..."
                : hasSearched
                ? "Không có tài khoản nào phù hợp. Hãy thay đổi từ khóa và thử lại."
                : "Chưa có dữ liệu. Nhập điều kiện và nhấn Tìm kiếm để tải danh sách."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
</div>


          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground">
                Trang {currentPage}/{totalPages} • Tổng: {total}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Số dòng:
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={async (v: string) => {
                      await changePageSize(Number(v));
                    }}
                  >
                    <SelectTrigger className="w-20 bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 mr-1"
                    onClick={async () => changePage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={async () => changePage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="mx-3 text-sm">
                    Trang {currentPage}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={async () => changePage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 ml-1"
                    onClick={async () => changePage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
