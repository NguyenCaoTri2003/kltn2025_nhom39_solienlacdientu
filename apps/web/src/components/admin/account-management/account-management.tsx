"use client";

import { useEffect, useState } from "react";
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
  Shield,
  User,
  Eye,
  Pencil,
  Lock,
  Unlock,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Plus,
  FileClock,
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

interface Account {
  id: string;
  name: string;
  role: "admin" | "lecturer" | "student" | "parent";
  status: "active" | "inactive" | "suspended";
  lastLogin: string;
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
};

export function AccountManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  type AccountStatusFilter = "all" | "active" | "inactive" | "suspended";
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>("all");
  type AccountRoleFilter = "all" | "admin" | "lecturer" | "student" | "parent";
  const [roleFilter, setRoleFilter] = useState<AccountRoleFilter>("all");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // const [accounts] = useState<Account[]>([
  //   {
  //     id: "admin",
  //     name: "Administrator",
  //     role: "admin",
  //     status: "active",
  //     lastLogin: "2024-01-15 09:30",
  //     email: "admin@school.edu.vn",
  //   },
  //   {
  //     id: "GV001",
  //     name: "Nguyễn Văn An",
  //     role: "lecturer",
  //     status: "suspended",
  //     lastLogin: "2024-01-15 08:45",
  //     email: "nva@school.edu.vn",
  //   },
  //   {
  //     id: "GV002",
  //     name: "Trần Thị Bình",
  //     role: "lecturer",
  //     status: "active",
  //     lastLogin: "2024-01-14 16:20",
  //     email: "ttb@school.edu.vn",
  //   },
  //   {
  //     id: "GV003",
  //     name: "Lê Văn Cường",
  //     role: "lecturer",
  //     status: "inactive",
  //     lastLogin: "2024-01-10 14:15",
  //     email: "lvc@school.edu.vn",
  //   },
  //   {
  //     id: "GV004",
  //     name: "Phạm Thị Dung",
  //     role: "lecturer",
  //     status: "suspended",
  //     lastLogin: "Chưa đăng nhập",
  //     email: "ptd@school.edu.vn",
  //   },
  //   // Ví dụ thêm role sinh viên và phụ huynh
  //   {
  //     id: "SV001",
  //     name: "Phạm Quốc Huy",
  //     role: "student",
  //     status: "active",
  //     lastLogin: "2024-01-12 10:05",
  //     email: "pqh@student.edu.vn",
  //   },
  //   {
  //     id: "PH001",
  //     name: "Trần Văn Nam",
  //     role: "parent",
  //     status: "inactive",
  //     lastLogin: "2024-01-09 18:22",
  //     email: "tvn@parent.edu.vn",
  //   },
  // ]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Gọi API khi load trang
  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/api/users`, {
          // Sử dụng cookie httpOnly từ đăng nhập -> cần gửi kèm credentials
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const result = await res.json().catch(() => ({}));

        if (res.ok && result.returnCode === 0 && Array.isArray(result.data)) {
          // map từ JSON thành Account interface
          const mapped = (result.data as ApiUser[]).map(
            (u: ApiUser): Account => ({
              id: String(u.id),
              name: u.full_name,
              role: u.role as Account["role"],
              status: u.status as Account["status"],
              email: u.email,
              lastLogin: u.last_login
                ? new Date(u.last_login).toLocaleString("vi-VN")
                : "Chưa đăng nhập",
            })
          );
          setAccounts(mapped);
        } else {
          // Ưu tiên hiển thị thông điệp cụ thể từ server
          if (res.status === 401) {
            setError("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn (401)");
          } else if (res.status === 403) {
            setError("Bạn không có quyền truy cập tài nguyên này (403)");
          } else {
            setError(result.message || "Không thể tải danh sách người dùng");
          }
        }
      } catch {
        setError("Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); 

  const filteredAccounts = accounts.filter((account) => {
    const matchSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      statusFilter === "all" || account.status === statusFilter;
    const matchRole = roleFilter === "all" || account.role === roleFilter;
    return matchSearch && matchStatus && matchRole;
  });

  const total = filteredAccounts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pagedAccounts = filteredAccounts.slice(
    startIndex,
    startIndex + pageSize
  );

  const goFirst = () => setPage(1);
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const goLast = () => setPage(totalPages);

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "lecturer":
      case "student":
      case "parent":
      default:
        return <User className="h-4 w-4" />;
    }
  };

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
                  placeholder="Tìm kiếm tài khoản..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 bg-input border-border"
                />
              </div>

              {/* Bộ lọc trạng thái */}
              <Select
                value={statusFilter}
                onValueChange={(value: AccountStatusFilter) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-40 bg-input border-border">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">
                    {translateStatus("active")}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {translateStatus("inactive")}
                  </SelectItem>
                  <SelectItem value="suspended">
                    {translateStatus("suspended")}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Bộ lọc vai trò */}
              <Select
                value={roleFilter}
                onValueChange={(value: AccountRoleFilter) => {
                  setRoleFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-40 bg-input border-border">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="admin">
                    {translateRole("admin")}
                  </SelectItem>
                  <SelectItem value="lecturer">
                    {translateRole("lecturer")}
                  </SelectItem>
                  <SelectItem value="student">
                    {translateRole("student")}
                  </SelectItem>
                  <SelectItem value="parent">
                    {translateRole("parent")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setRoleFilter("all");
                  setPage(1);
                }}
              >
                Đặt lại
              </Button>

              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Thêm tài khoản
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
                  // Thử lại
                  setError(null);
                  // Gọi lại API bằng cách tạm set loading và rerun logic
                  // Tái sử dụng logic trong useEffect bằng cách gọi lại tương tự
                  // Đơn giản nhất: lặp lại nội dung fetch ở đây
                  (async () => {
                    try {
                      setLoading(true);
                      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                      const res = await fetch(`${API_BASE}/api/users`, {
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                      });
                      const result = await res.json().catch(() => ({}));
                      if (res.ok && result.returnCode === 0 && Array.isArray(result.data)) {
                        const mapped = (result.data as ApiUser[]).map((u: ApiUser): Account => ({
                          id: String(u.id),
                          name: u.full_name,
                          role: u.role as Account["role"],
                          status: u.status as Account["status"],
                          email: u.email,
                          lastLogin: u.last_login
                            ? new Date(u.last_login).toLocaleString("vi-VN")
                            : "Chưa đăng nhập",
                        }));
                        setAccounts(mapped);
                      } else {
                        setError(result.message || `Lỗi tải dữ liệu (HTTP ${res.status})`);
                      }
                    } catch {
                      setError("Lỗi kết nối máy chủ");
                    } finally {
                      setLoading(false);
                    }
                  })();
                }}
              >
                Thử lại
              </Button>
            </div>
          )}
         <div className="rounded-md border border-border overflow-hidden">
  {/* ✅ Thêm cả cuộn dọc & ngang */}
  <div className="overflow-x-auto overflow-y-auto max-h-[65vh]">
    <Table className="min-w-[800px]"> {/* min width để cuộn ngang có tác dụng */}
      <TableHeader>
        <TableRow className="border-border sticky top-0 bg-card z-10">
          <TableHead className="text-muted-foreground">Mã số</TableHead>
          <TableHead className="text-muted-foreground">Họ tên</TableHead>
          <TableHead className="text-muted-foreground">Vai trò</TableHead>
          <TableHead className="text-muted-foreground w-[100px]">Email</TableHead>
          <TableHead className="text-muted-foreground">Trạng thái</TableHead>
          <TableHead className="text-muted-foreground">Đăng nhập cuối</TableHead>
          <TableHead className="text-muted-foreground">Thao tác</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {loading && (
          <>
            {Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={`sk-${idx}`} className="border-border">
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
                <TableCell>
                  <Skeleton className="h-6 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </>
        )}

        {pagedAccounts.map((account) => (
          <TableRow
            key={account.id}
            className="border-border hover:bg-accent/40 transition-colors"
          >
            <TableCell className="font-medium text-card-foreground">
              {account.id}
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

            {/* ✅ Email: Giới hạn 100px, cho xuống dòng */}
            <TableCell className="text-muted-foreground max-w-[200px] whitespace-normal break-words">
              {account.email}
            </TableCell>

            <TableCell>{getStatusBadge(account.status)}</TableCell>

            <TableCell className="text-muted-foreground">
              {account.lastLogin}
            </TableCell>

            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
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
                    <DropdownMenuItem className="text-red-400 hover:bg-accent">
                      <Lock className="w-4 h-4 mr-2" /> Khóa tài khoản
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem className="text-green-400 hover:bg-accent">
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
              colSpan={7}
              className="text-center text-muted-foreground py-8"
            >
              {loading
                ? "Đang tải dữ liệu..."
                : "Không có tài khoản nào phù hợp. Hãy thử thay đổi bộ lọc."}
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
                Hiển thị {startIndex + 1}-
                {Math.min(startIndex + pageSize, total)} trên {total}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Số dòng:
                  </span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v: string) => {
                      setPageSize(Number(v));
                      setPage(1);
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
                    onClick={goFirst}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={goPrev}
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
                    onClick={goNext}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 ml-1"
                    onClick={goLast}
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
