"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChangePageSize: (size: number) => void | Promise<void>;
  onChangePage: (page: number) => void | Promise<void>;
  disabled?: boolean;
}

export function AccountPagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onChangePageSize,
  onChangePage,
  disabled,
}: Props) {
  if (total <= 0) return null;
  return (
    <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
      <div className="text-sm text-muted-foreground">Trang {currentPage}/{totalPages} • Tổng: {total}</div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Số dòng:</span>
          <Select value={String(pageSize)} onValueChange={(v: string) => onChangePageSize(Number(v))}>
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
          <Button variant="outline" size="icon" className="h-8 w-8 mr-1" onClick={() => onChangePage(1)} disabled={disabled || currentPage === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChangePage(Math.max(1, currentPage - 1))}
            disabled={disabled || currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="mx-3 text-sm">Trang {currentPage}/{totalPages}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChangePage(Math.min(totalPages, currentPage + 1))}
            disabled={disabled || currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 ml-1" onClick={() => onChangePage(totalPages)} disabled={disabled || currentPage === totalPages}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
