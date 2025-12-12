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
import { validateDateRange } from "@/services/dateValidation";
import {
  type NotificationRow,
  fetchNotifications,
  fetchAllNotifications,
  deleteNotification,
  deleteMultipleNotifications,
  canDeleteNotification,
  filterDeletableNotifications,
  getSelectableNotifications,
  calculateSelectAllState,
  calculateToggleSelectAllIds,
} from "@/services/notificationManagementService";

type NotificationType = "university" | "lecturer" | "system";

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
  const [dateError, setDateError] = useState<string | null>(null);

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
      const currentPage = overridePage ?? page;
      const currentPageSize = overridePageSize ?? pageSize;
      const token = getToken();

      const result = await fetchNotifications({
        page: currentPage,
        pageSize: currentPageSize,
        title,
        content,
        type,
        category,
        status,
        from,
        to,
        token,
        apiBase: API_BASE,
      });

      setItems(result.data);
      setTotal(result.total);
      if (clearSelection) {
        setSelectedIds(new Set());
      }
    } catch (e) {
      console.error("Fetch notifications failed:", e);
      setItems([]);
      setTotal(0);
      if (clearSelection) {
        setSelectedIds(new Set());
      }
    } finally {
      setLoading(false);
    }
  };


  const validateDates = (): boolean => {
    setDateError(null);
    const result = validateDateRange(from, to);
    
    if (!result.isValid) {
      setDateError(result.error || null);
      return false;
    }
    
    return true;
  };
  

  const onSearch = () => {
    if (!validateDates()) {
      return; 
    }
    setPage(1);
    fetchList(1, pageSize, true); 
  };

  const onReset = () => {
    setTitle("");
    setContent("");
    setType("all");
    setCategory("all");
    setStatus("all");
    setFrom("");
    setTo("");
    setDateError(null);
    setPage(1);
    fetchList(1, pageSize, true); 
  };

  const handleDelete = async (id: number) => {
    const notification = items.find((it) => it.id === id);
    if (!notification) {
      toast.error("Không tìm thấy thông báo");
      return;
    }

    if (!canDeleteNotification(notification)) {
      toast.error("Chỉ có thể xóa thông báo đã gửi");
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      await deleteNotification({
        notificationId: id,
        token,
        apiBase: API_BASE,
      });
      toast.success("Đã xóa thông báo");
      fetchList(page, pageSize, false);
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

    const sentNotificationIds = filterDeletableNotifications(items, Array.from(selectedIds));

    if (sentNotificationIds.length === 0) {
      toast.error("Không có thông báo nào có thể xóa. Chỉ có thể xóa thông báo đã gửi");
      return;
    }

    const confirmMessage = `Bạn có chắc chắn muốn xóa ${sentNotificationIds.length} thông báo đã gửi?`;
    const confirmed = await confirmWithToast(confirmMessage);
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      const token = getToken();
      const result = await deleteMultipleNotifications({
        notificationIds: sentNotificationIds,
        token,
        apiBase: API_BASE,
      });
      toast.success(`Đã xóa ${result.affected} thông báo`);
      setSelectedIds(new Set());
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
      try {
        setLoading(true);
        const token = getToken();
        const allNotifications = await fetchAllNotifications({
          title,
          content,
          type,
          category,
          status,
          from,
          to,
          token,
          apiBase: API_BASE,
        });

        const { newSelectedIds, count } = calculateToggleSelectAllIds(allNotifications, selectedIds);
        const wasAllSelected = count > 0 && getSelectableNotifications(allNotifications).every((it) => selectedIds.has(it.id));
        
        setSelectedIds(newSelectedIds);
        
        if (!wasAllSelected && count > 0) {
          toast.success(`Đã chọn ${count} thông báo đã gửi`);
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
    const notification = items.find((it) => it.id === id);

    if (checked === true) {
      if (!canDeleteNotification(notification)) {
        toast.error("Chỉ có thể chọn thông báo đã gửi để xóa");
        return;
      }
      setSelectedIds(new Set([...selectedIds, id]));
    } else {
      const newSelected = new Set(selectedIds);
      newSelected.delete(id);
      setSelectedIds(newSelected);
    }
  };

  const sentItems = getSelectableNotifications(items);
  const { allSelected, someSelected } = calculateSelectAllState(items, selectedIds);

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
    <div className="max-w-full mx-auto py-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý thông báo</h1>
        <p className="text-muted-foreground">Tạo và quản lý thông báo cho người dùng</p>
      </div>

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
              onChange={(e) => {
                setFrom(e.target.value);
                setDateError(null); 
              }}
              max={to || undefined} 
              className={`bg-white border-border ${dateError ? "border-red-500" : ""}`}
            />
          </div>

          <div className="flex flex-col">
            <Label>Đến ngày</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setDateError(null); 
              }}
              min={from || undefined} 
              max={new Date().toISOString().split('T')[0]} 
              className={`bg-white border-border ${dateError ? "border-red-500" : ""}`}
            />
            {dateError && (
              <p className="text-sm text-red-500 mt-1">{dateError}</p>
            )}
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
                disabled={loading || sentItems.length === 0}
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
                    disabled={loading || it.status !== "sent"}
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
          fetchList(page, pageSize, false); 
        }}
      />

      <NotificationDetailModal open={detailOpen} onClose={() => setDetailOpen(false)} item={detailItem} />
    </div>
  );
}

