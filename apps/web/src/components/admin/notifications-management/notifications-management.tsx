"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { NotificationDetailModal } from "./NotificationDetailModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, SlidersHorizontal, Search, Trash2 } from "lucide-react";
import { translateNotificationCategory, translateSenderType, statusNotification } from "@packages/utils/translations";
import { CreateNotificationModal } from "./CreateNotificationModal";
import { NotificationRowActions } from "@/components/admin/modals_UI/NotificationRowActions";
import { Checkbox } from "@/components/ui/checkbox";
import { confirmWithToast } from "@/components/ui/confirm-with-toast";

type NotificationType = "university" | "lecturer" | "system";

type NotificationRow = {
  id: number;
  title: string | null;
  content: string | null;
  type: NotificationType | null;
  category: string | null;
  created_at?: string;
  url?: string | null;
  broadcast_group_id?: string | null;
  status?: "sent" | "deleted" | null;
};

export function NotificationsManagement() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<NotificationRow | null>(null);

  // selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // filters
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<NotificationType | "all">("all");
  type CategoryOption = "all" | "ACADEMIC" | "SYSTEM" | "FINANCE" | "GENERAL";
  const [category, setCategory] = useState<CategoryOption>("all");
  type StatusOption = "all" | "sent" | "deleted";
  const [status, setStatus] = useState<StatusOption>("all");
  const [from, setFrom] = useState<string>(""); // YYYY-MM-DD
  const [to, setTo] = useState<string>(""); // YYYY-MM-DD

  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000", []);

  const getToken = () => {
    if (typeof window === "undefined") return null;
    const cookieToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    return cookieToken || localStorage.getItem("token");
  };

  const fetchList = async (overridePage?: number, overridePageSize?: number, clearSelection: boolean = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const currentPage = overridePage ?? page;
      const currentPageSize = overridePageSize ?? pageSize;
      params.set("page", String(currentPage));
      params.set("pageSize", String(currentPageSize));
      if (title.trim()) params.set("title", title.trim());
      if (content.trim()) params.set("content", content.trim());
      if (type && type !== "all") params.set("type", type);
      if (category && category !== "all") params.set("category", category);
      if (status && status !== "all") params.set("status", status);
      if (from) params.set("from", from); // interpreted at API as +7 day start
      if (to) params.set("to", to);       // interpreted at API as +7 day end

      const token = getToken();
      const res = await fetch(`${API_BASE}/api/notifications?${params.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.returnCode !== 0) {
        throw new Error(data?.message || `Fetch failed (${res.status})`);
      }
      setItems(data.data || []);
      setTotal(data.meta?.total || 0);
      // Chỉ clear selection khi search/reset filter, không clear khi chuyển trang
      if (clearSelection) {
        setSelectedIds(new Set());
      }
    } catch (e) {
      console.error("Fetch notifications failed:", e);
      setItems([]);
      setTotal(0);
      // Chỉ clear selection khi có lỗi và clearSelection = true
      if (clearSelection) {
        setSelectedIds(new Set());
      }
    } finally {
      setLoading(false);
    }
  };


  const onSearch = () => {
    setPage(1);
    fetchList(1, pageSize, true); // Clear selection khi search
  };

  const onReset = () => {
    setTitle("");
    setContent("");
    setType("all");
    setCategory("all");
    setStatus("all");
    setFrom("");
    setTo("");
    setPage(1);
    fetchList(1, pageSize, true); // Clear selection khi reset
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/notifications`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ notificationId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.returnCode !== 0) {
        throw new Error(data?.message || `Delete failed (${res.status})`);
      }
      toast.success("Đã xóa thông báo");
      fetchList(page, pageSize, false); // Giữ selection sau khi xóa
    } catch (e) {
      console.error("Delete notification failed:", e);
      toast.error(e instanceof Error ? e.message : "Xóa thông báo thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một thông báo để xóa");
      return;
    }

    const confirmMessage = `Bạn có chắc chắn muốn xóa ${selectedIds.size} thông báo đã chọn?`;
    const confirmed = await confirmWithToast(confirmMessage);
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      const notificationIds = Array.from(selectedIds);
      const res = await fetch(`${API_BASE}/api/notifications`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ notificationIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.returnCode !== 0) {
        throw new Error(data?.message || `Delete failed (${res.status})`);
      }
      const affectedCount = data?.data?.affected || selectedIds.size;
      toast.success(`Đã xóa ${affectedCount} thông báo`);
      setSelectedIds(new Set()); // Clear selection sau khi xóa nhiều
      fetchList(page, pageSize, false);
    } catch (e) {
      console.error("Delete multiple notifications failed:", e);
      toast.error(e instanceof Error ? e.message : "Xóa thông báo thất bại");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const toggleSelectAll = async (checked: boolean | "indeterminate") => {
    if (checked === true || checked === "indeterminate") {
      // Load tất cả notifications theo filter hiện tại
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("pageSize", "10000"); // Lấy tất cả (limit lớn)
        if (title.trim()) params.set("title", title.trim());
        if (content.trim()) params.set("content", content.trim());
        if (type && type !== "all") params.set("type", type);
        if (category && category !== "all") params.set("category", category);
        if (status && status !== "all") params.set("status", status);
        if (from) params.set("from", from);
        if (to) params.set("to", to);

        const token = getToken();
        const res = await fetch(`${API_BASE}/api/notifications?${params.toString()}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          credentials: "include",
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.returnCode === 0 && Array.isArray(data.data)) {
          const allNotifications = data.data as NotificationRow[];
          const allIds = allNotifications.map((it) => it.id);
          
          // Kiểm tra xem đã chọn hết chưa
          const allSelected = allIds.every((id) => selectedIds.has(id));
          
          if (allSelected) {
            // Bỏ chọn tất cả
            const newSelected = new Set(selectedIds);
            allIds.forEach((id) => newSelected.delete(id));
            setSelectedIds(newSelected);
          } else {
            // Chọn tất cả
            const newSelected = new Set(selectedIds);
            allIds.forEach((id) => newSelected.add(id));
            setSelectedIds(newSelected);
            toast.success(`Đã chọn ${allIds.length} thông báo`);
          }
        } else {
          toast.error("Không thể tải danh sách thông báo");
        }
      } catch (e) {
        console.error("Error selecting all notifications:", e);
        toast.error("Lỗi khi chọn tất cả thông báo");
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectItem = (id: number, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds(new Set([...selectedIds, id]));
    } else {
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
    }
  };

  const allSelected = items.length > 0 && items.every((it) => selectedIds.has(it.id));
  const someSelected = items.some((it) => selectedIds.has(it.id)) && !allSelected;

  const renderStatusBadge = (s?: "sent" | "deleted" | null) => {
    const label = statusNotification(s || undefined) || "-";
    if (s === "sent") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          {label}
        </span>
      );
    }
    if (s === "deleted") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300">
          {label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        {label}
      </span>
    );
  };

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý thông báo</h1>
        <p className="text-muted-foreground">Tạo và quản lý thông báo cho người dùng</p>
      </div>


      <div className="border rounded-xl p-5 bg-white shadow-sm space-y-6 mb-6">
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
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    <div className="flex flex-col">
      <Label>Tiêu đề</Label>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-white border-border"
        placeholder="Tìm tiêu đề"
      />
    </div>

    <div className="flex flex-col">
      <Label>Nội dung</Label>
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="bg-white border-border"
        placeholder="Tìm nội dung"
      />
    </div>

    <div className="flex flex-col">
      <Label>Loại</Label>
      <Select value={type} onValueChange={(v: NotificationType | "all") => setType(v)}>
      <SelectTrigger className="bg-white border-border">
          <SelectValue placeholder="Chọn loại" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="university">Đại học</SelectItem>
          <SelectItem value="lecturer">Giảng viên</SelectItem>
          <SelectItem value="system">Hệ thống</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="flex flex-col">
      <Label>Danh mục</Label>
      <Select value={category} onValueChange={(v: CategoryOption) => setCategory(v)}>
      <SelectTrigger className="bg-white border-border">
          <SelectValue placeholder="Chọn danh mục" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="GENERAL">Chung</SelectItem>
          <SelectItem value="ACADEMIC">Học vụ</SelectItem>
          <SelectItem value="APPOINTMENT">Lịch hẹn</SelectItem>
          <SelectItem value="SYSTEM">Hệ thống</SelectItem>
          <SelectItem value="FINANCE">Tài chính</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="flex flex-col">
      <Label>Trạng thái</Label>
      <Select value={status} onValueChange={(v: StatusOption) => setStatus(v)}>
      <SelectTrigger className="bg-white border-border">
          <SelectValue placeholder="Chọn trạng thái" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="sent">Đã gửi</SelectItem>
          <SelectItem value="deleted">Đã xóa</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="flex flex-col">
      <Label>Từ ngày</Label>
      <Input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="bg-white border-border"
      />
    </div>

    <div className="flex flex-col">
      <Label>Đến ngày</Label>
      <Input
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="bg-white border-border"
      />
    </div>
  </div>

  {/* Buttons row */}
  <div className="flex flex-wrap justify-between items-center gap-3 pt-2">
    <div className="flex items-center gap-2">
      {selectedIds.size > 0 && (
        <Button
          onClick={handleDeleteMultiple}
          disabled={loading}
          variant="destructive"
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang xóa...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Xóa đã chọn ({selectedIds.size})
            </>
          )}
        </Button>
      )}
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={() => setCreateModalOpen(true)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Tạo thông báo
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

</div>


      {/* Danh sách */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Danh sách thông báo</CardTitle>
          <CardDescription className="text-muted-foreground">Hiển thị theo nhóm broadcast</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            headers={[
              <Checkbox
                key="select-all"
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={toggleSelectAll}
                disabled={loading || items.length === 0}
              />,
              "Tiêu đề",
              "Loại",
              "Danh mục",
              "Trạng thái",
              "Thời gian",
              "Thao tác",
            ]}
            maxHeight="auto"
            maxWidth="100%"
          >
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-muted-foreground" colSpan={7}>Không có thông báo</td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="border-b last:border-b-0">
                <td className="px-4 py-2">
                  <Checkbox
                    checked={selectedIds.has(it.id)}
                    onCheckedChange={(checked) => toggleSelectItem(it.id, checked)}
                    disabled={loading}
                  />
                </td>
                <td className="px-4 py-2 max-w-[420px] truncate" title={it.title || it.content || undefined}>
                  {it.title || <span className="text-muted-foreground">(Không tiêu đề)</span>}
                </td>
                <td className="px-4 py-2">{translateSenderType(it.type || undefined) || '-'}</td>
                <td className="px-4 py-2">{translateNotificationCategory(it.category || undefined) || '-'}</td>
                <td className="px-4 py-2">{renderStatusBadge(it.status)}</td>
                <td className="px-4 py-2">{it.created_at ? new Date(it.created_at).toLocaleString("vi-VN") : '-'}</td>
                <td className="px-4 py-2 w-[50px]">
                  <NotificationRowActions
                    item={{ id: it.id, title: it.title, url: it.url }}
                    isBusy={loading}
                    onViewDetail={() => { setDetailItem(it); setDetailOpen(true); }}
                    onDelete={handleDelete}
                  />
                </td>
              </tr>
            ))}
          </DataTable>

          <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
            <div className="text-sm text-muted-foreground">Tổng: {total}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled={page <= 1 || loading} onClick={async () => { const newPage = Math.max(1, page - 1); setPage(newPage); await fetchList(newPage, pageSize, false); }}>Trước</Button>
              <div className="text-sm">Trang {page}/{totalPages}</div>
              <Button variant="outline" disabled={page >= totalPages || loading} onClick={async () => { const newPage = Math.min(totalPages, page + 1); setPage(newPage); await fetchList(newPage, pageSize, false); }}>Sau</Button>
              <Select value={String(pageSize)} onValueChange={async (v) => { const newSize = Number(v); setPageSize(newSize); setPage(1); await fetchList(1, newSize, false); }}>
                <SelectTrigger className="bg-input border-border w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
      </div>
        </CardContent>
      </Card>

      <CreateNotificationModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          fetchList(page, pageSize, false); // Giữ selection sau khi tạo mới
        }}
      />

      <NotificationDetailModal open={detailOpen} onClose={() => setDetailOpen(false)} item={detailItem} />
    </div>
  );
}

