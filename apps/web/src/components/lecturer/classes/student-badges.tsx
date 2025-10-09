"use client";

import { Badge } from "@/components/ui/badge";

export function AcademicStatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; variant: "destructive" | "secondary" | "default" | "outline" }
  > = {
    studing: { label: "Đang học", variant: "default" },
    graduated: { label: "Đã tốt nghiệp", variant: "secondary" },
    warned: { label: "Bị cảnh báo", variant: "destructive" },
    suspended: { label: "Bị đình chỉ", variant: "outline" },
  };

  const item = map[status] ?? { label: "Không xác định", variant: "secondary" };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

export function TrainingTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; variant: "default" | "outline" }> = {
    regular: { label: "Chính quy", variant: "default" },
    advanced: { label: "Chất lượng cao", variant: "outline" },
  };

  const item = map[type] ?? { label: "Không rõ", variant: "outline" };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

export function TrainingLevelBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; variant: "secondary" | "default" }> = {
    bachelor: { label: "Đại học", variant: "default" },
    master: { label: "Thạc sĩ", variant: "secondary" },
    phd: { label: "Tiến sĩ", variant: "secondary" },
  };

  const item = map[level] ?? { label: "Không rõ", variant: "secondary" };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
