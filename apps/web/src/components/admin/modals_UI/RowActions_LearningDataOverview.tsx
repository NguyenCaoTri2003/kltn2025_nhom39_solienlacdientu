"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileWarning, FileClock, BarChart3, Loader2 } from "lucide-react";

interface Props {
  studentId: string;
  studentName: string;
  isBusy?: boolean;
  onCreateWarning: (id: string, name: string) => void;
  onViewDetails: (id: string) => void;
  onViewWarningHistory: (id: string) => void;
  proposedLabel?: string;
  proposedLevel?: number;
}

export function RowActionsLearningDataOverview({
  studentId,
  studentName,
  isBusy,
  onCreateWarning,
  onViewDetails,
  onViewWarningHistory,
  proposedLabel,
  proposedLevel,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={!!isBusy}>
          {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="bg-popover border-border min-w-48">
        <DropdownMenuItem
          className="text-popover-foreground hover:bg-accent"
          onClick={() => onCreateWarning(studentId, studentName)}
        >
          <FileWarning className="w-4 h-4 mr-2 text-red-500" />
          {proposedLevel && proposedLevel > 0
            ? `Tạo cảnh cáo (Đề xuất: ${proposedLabel || `Cảnh cáo ${proposedLevel}`})`
            : "Tạo cảnh cáo"}
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-popover-foreground hover:bg-accent"
          onClick={() => onViewDetails(studentId)}
        >
          <BarChart3 className="w-4 h-4 mr-2 text-blue-500" />
          Xem chi tiết kết quả học tập
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-popover-foreground hover:bg-accent"
          onClick={() => onViewWarningHistory(studentId)}
        >
          <FileClock className="w-4 h-4 mr-2 text-amber-500" />
          Lịch sử cảnh cáo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
