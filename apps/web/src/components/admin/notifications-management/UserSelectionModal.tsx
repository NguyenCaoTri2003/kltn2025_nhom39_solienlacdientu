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

declare const process: { env: Record<string, string | undefined> };

type ApiUser = {
  id: number | string;
  full_name: string;
  email: string;
  role: "admin" | "lecturer" | "student" | "parent";
  status: "active" | "inactive" | "suspended";
  _code?: string | null;
};

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
  // Lưu thông tin user đã chọn để hiển thị (không chỉ ID)
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
      const token = localStorage.getItem("token");
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(pageSize));
        if (search.trim()) {
          params.set("search", search.trim());
        }
        if (status && status !== "all") {
          params.set("status", status);
        }
        if (role && role !== "all") {
          params.set("role", role);
        }

        const res = await fetch(`${API_BASE}/api/users?${params.toString()}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await res.json().catch(() => ({}));
        if (
          res.ok &&
          result.returnCode === 0 &&
          Array.isArray(result.data?.users)
        ) {
          const pag = result.data?.pagination;
          const loadedUsers = result.data.users as ApiUser[];
          setUsers(loadedUsers);
          
          // Cập nhật selectedUsers với những user đã được chọn
          // Lưu tất cả user trong trang hiện tại vào selectedUsers
          // (sẽ được filter khi render dựa trên selectedIds)
          setSelectedUsers((prev) => {
            const updated = new Map(prev);
            loadedUsers.forEach((user) => {
              const userId = Number(user.id);
              updated.set(userId, user);
            });
            return updated;
          });
          
          if (pag) {
            setTotal(pag.total);
            setTotalPages(pag.totalPages);
            setPage(pag.page);
          }
        } else {
          setUsers([]);
          setTotal(0);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error loading users:", error);
        toast.error("Lỗi khi tải danh sách người dùng");
        setUsers([]);
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
      // selectedUsers sẽ được cập nhật tự động khi loadUsers được gọi
    }
  }, [open, selectedUserIds, statusFilter, roleFilter, loadUsers, searchQuery]);

  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        loadUsers(searchQuery, 1, statusFilter, roleFilter);
      }, 500); // Debounce 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, statusFilter, roleFilter, open, loadUsers]);

  const handleToggleUser = (userId: number) => {
    const newSelected = new Set(selectedIds);
    const newSelectedUsers = new Map(selectedUsers);
    
    if (newSelected.has(userId)) {
      // Bỏ chọn
      newSelected.delete(userId);
      newSelectedUsers.delete(userId);
    } else {
      // Chọn - lưu thông tin user
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
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "10000"); // Lấy tất cả user (limit lớn)
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (roleFilter && roleFilter !== "all") {
        params.set("role", roleFilter);
      }

      const res = await fetch(`${API_BASE}/api/users?${params.toString()}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json().catch(() => ({}));
      if (
        res.ok &&
        result.returnCode === 0 &&
        Array.isArray(result.data?.users)
      ) {
        const allUsers = result.data.users as ApiUser[];
        const allUserIds = allUsers.map((u) => Number(u.id));
        
        // Kiểm tra xem đã chọn hết chưa
        const allSelected = allUserIds.every((id) => selectedIds.has(id));
        
        if (allSelected) {
          // Bỏ chọn tất cả
          const newSelected = new Set(selectedIds);
          const newSelectedUsers = new Map(selectedUsers);
          allUserIds.forEach((id) => {
            newSelected.delete(id);
            newSelectedUsers.delete(id);
          });
          setSelectedIds(newSelected);
          setSelectedUsers(newSelectedUsers);
        } else {
          // Chọn tất cả - lưu thông tin user
          const newSelected = new Set(selectedIds);
          const newSelectedUsers = new Map(selectedUsers);
          allUsers.forEach((user) => {
            const userId = Number(user.id);
            newSelected.add(userId);
            newSelectedUsers.set(userId, user);
          });
          setSelectedIds(newSelected);
          setSelectedUsers(newSelectedUsers);
          toast.success(`Đã chọn ${allUserIds.length} người dùng`);
        }
      } else {
        toast.error("Không thể tải danh sách người dùng");
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
                  checked={
                    users.length > 0 && 
                    users.every((u) => selectedIds.has(Number(u.id)))
                  }
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

