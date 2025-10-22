"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CreateWarningModalProps {
  open: boolean;
  onClose: () => void;
  studentId: number | null;
  semesterId: number | null;
  apiBase?: string;
  onCreated?: () => void;
  defaultLevel?: "FIRST" | "SECOND" | "FINAL";
  studentName?: string;
}

export function CreateWarningModal({
  open,
  onClose,
  studentId,
  semesterId,
  apiBase,
  onCreated,
  defaultLevel,
}: CreateWarningModalProps) {
  const API_BASE = apiBase || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  const [level, setLevel] = useState<string>(defaultLevel || "FIRST");
  const [reason, setReason] = useState<string>("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open && defaultLevel) setLevel(defaultLevel);
  }, [open, defaultLevel]);

  const getToken = () => {
    try {
      if (typeof document !== "undefined") {
        const cookieToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];
        const lsToken = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
        return cookieToken || lsToken || null;
      }
    } catch {}
    return null;
  };

  const resolveLatestSemesterId = async (): Promise<number | null> => {
    if (!studentId) return null;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/students/overview?studentId=${studentId}&page=1&pageSize=1`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json?.returnCode === 0 && Array.isArray(json.data) && json.data.length > 0) {
        const semIdFromRow = json.data[0]?.semester_id;
        if (typeof semIdFromRow === "number" && semIdFromRow > 0) return Number(semIdFromRow);
        const semName: string | null | undefined = json.data[0]?.semester;
        if (semName) {
          const semRes = await fetch(`${API_BASE}/api/semesters`, {
            method: "GET",
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          const semJson = await semRes.json();
          if (semJson?.returnCode === 0 && Array.isArray(semJson.data)) {
            const list = semJson.data as Array<{ id: number; name: string }>;
            const found = list.find((s) => s.name === semName);
            if (found) return Number(found.id);
            const latest = list.reduce<{ id: number } | null>((acc, cur) => {
              if (!acc) return { id: Number(cur.id) };
              return Number(cur.id) > Number(acc.id) ? { id: Number(cur.id) } : acc;
            }, null);
            return latest ? Number(latest.id) : null;
          }
        }
      }
      // Fallback when overview fails or returns empty: choose latest semester overall
      const semRes = await fetch(`${API_BASE}/api/semesters`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const semJson = await semRes.json();
      if (semJson?.returnCode !== 0 || !Array.isArray(semJson.data)) return null;
      const list = semJson.data as Array<{ id: number; name: string }>;
      // Fallback: use latest semester overall (max id)
      const latest = list.reduce<{ id: number } | null>((acc, cur) => {
        if (!acc) return { id: Number(cur.id) };
        return Number(cur.id) > Number(acc.id) ? { id: Number(cur.id) } : acc;
      }, null);
      return latest ? Number(latest.id) : null;
    } catch {
      return null;
    }
  };

  const handleCreate = async () => {
    if (!studentId) {
      toast("Thiếu thông tin", { description: "Vui lòng chọn sinh viên.", className: "bg-red-500 text-white" });
      return;
    }

    if (!reason.trim()) {
      toast("Thiếu lý do", { description: "Vui lòng nhập lý do cảnh cáo.", className: "bg-red-500 text-white" });
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const semIdToUse = semesterId ?? (await resolveLatestSemesterId());
      if (!semIdToUse) {
        throw new Error("Không xác định được học kỳ. Vui lòng chọn học kỳ hoặc lọc theo học kỳ.");
      }

      const res = await fetch(`${API_BASE}/api/academic-warnings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          studentId,
          semesterId: semIdToUse,
          level,
          reason,
        }),
      });

      const json = await res.json();
      if (json?.returnCode !== 0) throw new Error(json?.message || "Tạo cảnh cáo thất bại.");

      toast("Thành công", { description: "Đã tạo cảnh cáo học tập mới." });
      onCreated?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi không xác định.";
      toast("Lỗi", { description: msg, className: "bg-red-500 text-white" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>Tạo cảnh cáo học tập</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Mức độ cảnh cáo</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn mức độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIRST">Cảnh cáo lần 1</SelectItem>
                <SelectItem value="SECOND">Cảnh cáo lần 2</SelectItem>
                <SelectItem value="FINAL">Cảnh cáo lần 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Lý do</Label>
            <Textarea
              placeholder="Nhập lý do cảnh cáo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Đang tạo..." : "Tạo cảnh cáo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
