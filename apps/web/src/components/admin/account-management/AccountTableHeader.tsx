"use client";

import { Button } from "@/components/ui/button";
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AccountStatus } from "@/services/accountManagementService";

interface AccountTableHeaderProps {
  selectedIds: string[];
  onBulkUpdateClick: () => void;
}

export function AccountTableHeader({
  selectedIds,
  onBulkUpdateClick,
}: AccountTableHeaderProps) {
  return (
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={selectedIds.length === 0}
            onClick={onBulkUpdateClick}
          >
            Cập nhật trạng thái ({selectedIds.length})
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}

