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
import type { AccountStatus, AccountRole } from "@/services/accountManagementService";

type RoleOption = "all" | AccountRole;
type StatusOption = "all" | AccountStatus;

interface AccountFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  statusFilter: StatusOption;
  onStatusFilterChange: (value: StatusOption) => void;
  roleFilter: RoleOption;
  facultyFilter: number | "all";
  onFacultyFilterChange: (value: number | "all") => void;
  classFilter: number | "all";
  onClassFilterChange: (value: number | "all") => void;
  faculties: Array<{ id: number; name: string }>;
  classes: Array<{ id: number; class_code: string }>;
  loading: boolean;
  onReset: () => void;
  onAddUser: () => void;
}

export function AccountFilters({
  searchInput,
  onSearchInputChange,
  onSearch,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  facultyFilter,
  onFacultyFilterChange,
  classFilter,
  onClassFilterChange,
  faculties,
  classes,
  loading,
  onReset,
  onAddUser,
}: AccountFiltersProps) {
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
              placeholder="Nhập tên, email, số điện thoại hoặc mã số..."
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
          <Label>Trạng thái</Label>
          <Select
            value={statusFilter}
            onValueChange={(v: string) => onStatusFilterChange(v as StatusOption)}
          >
            <SelectTrigger className="bg-white border-border">
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

        <div className="flex flex-col">
          {roleFilter === "lecturer" && (
            <>
              <Label>Khoa</Label>
              <Select
                value={facultyFilter === "all" ? "all" : String(facultyFilter)}
                onValueChange={(v: string) =>
                  onFacultyFilterChange(v === "all" ? "all" : Number(v))
                }
              >
                <SelectTrigger className="bg-white border-border">
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
            </>
          )}
          {roleFilter === "student" && (
            <>
              <Label>Lớp</Label>
              <Select
                value={classFilter === "all" ? "all" : String(classFilter)}
                onValueChange={(v: string) =>
                  onClassFilterChange(v === "all" ? "all" : Number(v))
                }
              >
                <SelectTrigger className="bg-white border-border">
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
            </>
          )}
          {roleFilter !== "lecturer" && roleFilter !== "student" && (
            <div className="h-10" />
          )}
        </div>
      </div>

      {/* Buttons row */}
      <div className="flex flex-wrap justify-end items-center gap-3 pt-2">
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          onClick={onAddUser}
        >
          <Plus className="h-4 w-4" />
          Thêm tài khoản
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

