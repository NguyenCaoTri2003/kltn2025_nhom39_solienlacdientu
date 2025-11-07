"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal, Trash2, Loader2, Link as LinkIcon } from "lucide-react";
import { confirmWithToast } from "@/components/ui/confirm-with-toast";

export interface NotificationRowData {
  id: number;
  title: string | null;
  url?: string | null;
}

interface Props {
  item: NotificationRowData;
  isBusy?: boolean;
  onViewDetail: (item: NotificationRowData) => void;
  onDelete: (id: number) => Promise<void> | void;
}

export function NotificationRowActions({ item, isBusy, onViewDetail, onDelete }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={!!isBusy}>
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border min-w-48">
        <DropdownMenuItem className="text-popover-foreground hover:bg-accent" onClick={() => onViewDetail(item)}>
          <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-400 hover:bg-accent"
          onClick={async () => {
            const ok = await confirmWithToast("Xác nhận xoá thông báo này?");
            if (!ok) return;
            await onDelete(item.id);
          }}
          disabled={!!isBusy}
        >
          <Trash2 className="w-4 h-4 mr-2 text-red-400" /> Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


