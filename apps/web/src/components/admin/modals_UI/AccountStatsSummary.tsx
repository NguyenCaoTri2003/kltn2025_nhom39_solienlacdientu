"use client";

import { UserCheck, UserX, Clock } from "lucide-react";

interface Props {
  active: number;
  inactive: number;
  suspended: number;
}

export function AccountStatsSummary({ active, inactive, suspended }: Props) {
  return (
    <div className="mt-4 text-sm text-muted-foreground">
      <span className="mr-4 inline-flex items-center gap-1">
        <UserCheck className="h-4 w-4 text-green-400" /> Hoạt động: {active}
      </span>
      <span className="mr-4 inline-flex items-center gap-1">
        <UserX className="h-4 w-4 text-red-400" /> Bị khóa: {inactive}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-4 w-4 text-yellow-400" /> Chờ kích hoạt: {suspended}
      </span>
    </div>
  );
}
