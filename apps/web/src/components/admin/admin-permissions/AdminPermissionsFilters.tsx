"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, Loader2, Plus } from "lucide-react";
import type { ChangeEvent, KeyboardEvent } from "react";
import type { AdminType } from "@/services/adminPermissionService";

type AdminTypeOption = "all" | AdminType;

interface AdminPermissionsFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  adminTypeFilter: AdminTypeOption;
  onAdminTypeFilterChange: (value: AdminTypeOption) => void;
  loading: boolean;
  onReset: () => void;
  onCreateAdmin: () => void;
}

export function AdminPermissionsFilters({
  searchInput,
  onSearchInputChange,
  onSearch,
  adminTypeFilter,
  onAdminTypeFilterChange,
  loading,
  onReset,
  onCreateAdmin,
}: AdminPermissionsFiltersProps) {
  return (
    <div className="border rounded-xl p-5 bg-white shadow-sm space-y-6 mb-6 dark:bg-card dark:border-border">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-600" />
          Bộ lọc tìm kiếm
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-sm text-gray-600 hover:text-red-600"
          disabled={loading}
        >
          Đặt lại bộ lọc
        </Button>
      </div>

      {/* Grid inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <Label>Từ khóa</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nhập tên hoặc email..."
              value={searchInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onSearchInputChange(e.target.value)
              }
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") onSearch();
              }}
              className="pl-10 bg-white border-border"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <Label>Loại quyền</Label>
          <Select
            value={adminTypeFilter ?? "all"}
            onValueChange={(v: string) => onAdminTypeFilterChange(v as AdminTypeOption)}
          >
            <SelectTrigger className="bg-white border-border">
              <SelectValue placeholder="Lọc theo quyền" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="super_admin">Toàn quyền Quản trị</SelectItem>
              <SelectItem value="admin">Quản trị viên (admin)</SelectItem>
              {/* <SelectItem value="admin_account">Quản trị Tài khoản</SelectItem>
              <SelectItem value="admin_academic">Quản trị Học vụ</SelectItem>
              <SelectItem value="admin_finance">Quản trị Tài chính</SelectItem> */}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col">
          {/* Empty space for alignment */}
        </div>
      </div>

      {/* Buttons row */}
      <div className="flex flex-wrap justify-end items-center gap-3 pt-2">
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          onClick={onCreateAdmin}
        >
          <Plus className="h-4 w-4" />
          Tạo Admin mới
        </Button>
        <Button
          onClick={onSearch}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tìm...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Tìm kiếm
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

