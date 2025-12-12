"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Check, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { translateStatus, translateRole } from "@packages/utils/translations";
import {
  type ApiUser,
  getToken,
  fetchUsers,
  fetchAllUsers,
  calculateSelectAllInPage,
  calculateToggleSelectAllUsers,
} from "@/services/userSelectionService";

declare const process: { env: Record<string, string | undefined> };

interface UserSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (userIds: number[]) => void;
  selectedUserIds?: number[];
}

export function UserSelectionModal({
  open,
  onClose,
  onConfirm,
  selectedUserIds = [],
}: UserSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(selectedUserIds)
  );
  const [selectedUsers, setSelectedUsers] = useState<Map<number, ApiUser>>(new Map());
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "suspended">("active");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "lecturer" | "student" | "parent">("all");
  const pageSize = 20;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const loadUsers = useCallback(
    async (
      search: string = "",
      pageNum: number = 1,
      status: string = "active",
      role: string = "all"
    ) => {
      const token = getToken();
      try {
        setLoading(true);
        const result = await fetchUsers({
          page: pageNum,
          limit: pageSize,
          search,
          status: status as "all" | "active" | "inactive" | "suspended",
          role: role as "all" | "admin" | "lecturer" | "student" | "parent",
          token,
          apiBase: API_BASE,
        });

        setUsers(result.users);

        // Cập nhật selectedUsers với những user đã được chọn
        setSelectedUsers((prev) => {
          const updated = new Map(prev);
          result.users.forEach((user) => {
            const userId = Number(user.id);
            updated.set(userId, user);
          });
          return updated;
        });

        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
        setPage(result.pagination.page);
      } catch (error) {
        console.error("Error loading users:", error);
        toast.error("Lỗi khi tải danh sách người dùng");
        setUsers([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [API_BASE, pageSize]
  );

  useEffect(() => {
    if (open) {
      loadUsers(searchQuery, 1, statusFilter, roleFilter);
      setSelectedIds(new Set(selectedUserIds));
    }
  }, [open, selectedUserIds, statusFilter, roleFilter, loadUsers, searchQuery]);

  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        loadUsers(searchQuery, 1, statusFilter, roleFilter);
      }, 500); 

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, statusFilter, roleFilter, open, loadUsers]);

  const handleToggleUser = (userId: number) => {
    const newSelected = new Set(selectedIds);
    const newSelectedUsers = new Map(selectedUsers);
    
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
      newSelectedUsers.delete(userId);
    } else {
      newSelected.add(userId);
      const user = users.find((u) => Number(u.id) === userId);
      if (user) {
        newSelectedUsers.set(userId, user);
      }
    }
    setSelectedIds(newSelected);
    setSelectedUsers(newSelectedUsers);
  };

  const handleSelectAll = async () => {
    const token = getToken();
    try {
      setLoading(true);
      const allUsers = await fetchAllUsers({
        search: searchQuery,
        status: statusFilter,
        role: roleFilter,
        token,
        apiBase: API_BASE,
      });

      const { newSelectedIds, newSelectedUsers, count } = calculateToggleSelectAllUsers(
        allUsers,
        selectedIds
      );

      const wasAllSelected = allUsers.length > 0 && 
        allUsers.every((u) => selectedIds.has(Number(u.id)));

      setSelectedIds(newSelectedIds);

      setSelectedUsers((prev) => {
        const updated = new Map(prev);
        if (wasAllSelected) {
          allUsers.forEach((user) => {
            updated.delete(Number(user.id));
          });
        } else {
          newSelectedUsers.forEach((user, userId) => {
            updated.set(userId, user);
          });
        }
        return updated;
      });

      if (!wasAllSelected && count > 0) {
        toast.success(`Đã chọn ${count} người dùng`);
      }
    } catch (error) {
      console.error("Error selecting all users:", error);
      toast.error("Lỗi khi chọn tất cả người dùng");
    } finally {
      setLoading(false);
    }
  };


  const handleConfirm = () => {
    const userIds = Array.from(selectedIds);
    if (userIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một người dùng");
      return;
    }
    onConfirm(userIds);
    onClose();
  };

  const handleRemoveSelected = (userId: number) => {
    const newSelected = new Set(selectedIds);
    const newSelectedUsers = new Map(selectedUsers);
    newSelected.delete(userId);
    newSelectedUsers.delete(userId);
    setSelectedIds(newSelected);
    setSelectedUsers(newSelectedUsers);
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
        return <Badge variant="secondary">{text}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle>Chọn người dùng</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          {/* Search and Status Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên, email, mã..."
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={statusFilter}
                onValueChange={(v: "all" | "active" | "inactive" | "suspended") => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Bị khoá</SelectItem>
                  <SelectItem value="suspended">Chờ kích hoạt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select
                value={roleFilter}
                onValueChange={(v: "all" | "admin" | "lecturer" | "student" | "parent") => {
                  setRoleFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="admin">Quản trị</SelectItem>
                  <SelectItem value="lecturer">Giảng viên</SelectItem>
                  <SelectItem value="student">Sinh viên</SelectItem>
                  <SelectItem value="parent">Phụ huynh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected users badges */}
          {selectedIds.size > 0 && (
            <div className="space-y-2">
              <Label>Đã chọn ({selectedIds.size})</Label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border rounded-md bg-gray-50">
                {Array.from(selectedUsers.values())
                  .filter((user) => selectedIds.has(Number(user.id)))
                  .map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      <span>{user.full_name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSelected(Number(user.id));
                        }}
                        className="ml-1 rounded-full hover:bg-gray-300 p-0.5 transition-colors"
                        aria-label={`Bỏ chọn ${user.full_name}`}
                      >
                        <X className="h-3 w-3 cursor-pointer" />
                      </button>
                    </Badge>
                  ))}
                {/* Hiển thị số lượng user chưa có thông tin */}
                {selectedIds.size > selectedUsers.size && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    +{selectedIds.size - selectedUsers.size} người khác
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Users list */}
          <div className="flex-1 min-h-0 flex flex-col border rounded-md">
            <div className="p-2 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={calculateSelectAllInPage(users, selectedIds)}
                  onCheckedChange={handleSelectAll}
                  disabled={loading}
                />
                <span className="text-sm font-medium">
                  Chọn tất cả
                </span>
              </div>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading && users.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  Không tìm thấy người dùng
                </div>
              ) : (
                <div className="divide-y">
                  {users.map((user) => {
                    const userId = Number(user.id);
                    const isSelected = selectedIds.has(userId);
                    return (
                      <div
                        key={user.id}
                        className="p-3 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                        onClick={() => handleToggleUser(userId)}
                      >
                        <Checkbox checked={isSelected} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                            {user._code && ` • ${user._code}`}
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Badge variant="outline">
                            {translateRole(user.role)}
                          </Badge>
                          {getStatusBadge(user.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-2 border-t bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Trang {page} / {totalPages} • Tổng {total} người dùng
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadUsers(searchQuery, page - 1, statusFilter, roleFilter)}
                    disabled={page <= 1 || loading}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadUsers(searchQuery, page + 1, statusFilter, roleFilter)}
                    disabled={page >= totalPages || loading}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
            <Check className="mr-2 h-4 w-4" />
            Xác nhận ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

