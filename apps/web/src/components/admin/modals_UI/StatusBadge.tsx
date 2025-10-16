"use client";

import { Badge } from "@/components/ui/badge";
import { translateStatus } from "@packages/utils/translations";

export type StatusType = "active" | "inactive" | "suspended" | string;

export function StatusBadge({ status }: { status: StatusType }) {
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
}
