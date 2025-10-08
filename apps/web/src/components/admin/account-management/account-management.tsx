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
import {
  Search,
  UserCheck,
  UserX,
  Clock,
  MoreHorizontal,
  Shield,
  User,
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

interface Account {
  id: string;
  name: string;
  role: "admin" | "teacher";
  status: "active" | "inactive" | "suspended";
  lastLogin: string;
  email: string;
}

export function AccountManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  type AccountStatusFilter = "all" | "active" | "inactive" | "suspended";
  const [statusFilter, setStatusFilter] = useState<AccountStatusFilter>("all");

  const [accounts] = useState<Account[]>([
    {
      id: "admin",
      name: "Administrator",
      role: "admin",
      status: "active",
      lastLogin: "2024-01-15 09:30",
      email: "admin@school.edu.vn",
    },
    {
      id: "GV001",
      name: "Nguyễn Văn An",
      role: "teacher",
      status: "suspended",
      lastLogin: "2024-01-15 08:45",
      email: "nva@school.edu.vn",
    },
    {
      id: "GV002",
      name: "Trần Thị Bình",
      role: "teacher",
      status: "active",
      lastLogin: "2024-01-14 16:20",
      email: "ttb@school.edu.vn",
    },
    {
      id: "GV003",
      name: "Lê Văn Cường",
      role: "teacher",
      status: "inactive",
      lastLogin: "2024-01-10 14:15",
      email: "lvc@school.edu.vn",
    },
    {
      id: "GV004",
      name: "Phạm Thị Dung",
      role: "teacher",
      status: "suspended",
      lastLogin: "Chưa đăng nhập",
      email: "ptd@school.edu.vn",
    },
  ]);

  const filteredAccounts = accounts.filter((account) => {
    const matchSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      statusFilter === "all" || account.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Hoạt động
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Bị khóa
          </Badge>
        );
      case "suspended":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Chờ kích hoạt
          </Badge>
        );
      default:
        return <Badge variant="secondary">Không xác định</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    return role === "admin" ? (
      <Shield className="h-4 w-4" />
    ) : (
      <User className="h-4 w-4" />
    );
  };

  // tính toán số lượng tài khoản thật sự theo trạng thái
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-card-foreground">
                Danh sách tài khoản
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Quản lý tất cả tài khoản trong hệ thống
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 flex-wrap">
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
                onValueChange={(value: AccountStatusFilter) =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-48 bg-input border-border">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Bị khóa</SelectItem>
                  <SelectItem value="suspended">Chờ kích hoạt</SelectItem>
                </SelectContent>
              </Select>

              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Thêm tài khoản
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Mã số</TableHead>
                <TableHead className="text-muted-foreground">Họ tên</TableHead>
                <TableHead className="text-muted-foreground">Vai trò</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">
                  Trạng thái
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Đăng nhập cuối
                </TableHead>
                <TableHead className="text-muted-foreground">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id} className="border-border">
                  <TableCell className="font-medium text-card-foreground">
                    {account.id}
                  </TableCell>
                  <TableCell className="text-card-foreground">
                    {account.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(account.role)}
                      <span className="text-card-foreground">
                        {account.role === "admin"
                          ? "Quản trị viên"
                          : "Giảng viên"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
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
                        className="bg-popover border-border"
                      >
                        <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                          Chỉnh sửa
                        </DropdownMenuItem>
                        {account.status === "active" ? (
                          <DropdownMenuItem className="text-red-400 hover:bg-accent">
                            Khóa tài khoản
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-400 hover:bg-accent">
                            Kích hoạt tài khoản
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-popover-foreground hover:bg-accent">
                          Lịch sử đăng nhập
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAccounts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-6"
                  >
                    Không có tài khoản nào phù hợp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
