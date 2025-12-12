type NotificationType = "university" | "lecturer" | "system";

export type NotificationRow = {
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

type CategoryOption = "all" | "ACADEMIC" | "SYSTEM" | "FINANCE" | "GENERAL";
type StatusOption = "all" | "sent" | "deleted";

interface FetchNotificationsParams {
  page: number;
  pageSize: number;
  title?: string;
  content?: string;
  type?: NotificationType | "all";
  category?: CategoryOption;
  status?: StatusOption;
  from?: string;
  to?: string;
  token: string | null;
  apiBase: string;
}

interface DeleteNotificationParams {
  notificationId: number;
  token: string | null;
  apiBase: string;
}

interface DeleteMultipleNotificationsParams {
  notificationIds: number[];
  token: string | null;
  apiBase: string;
}

interface FetchAllNotificationsParams {
  title?: string;
  content?: string;
  type?: NotificationType | "all";
  category?: CategoryOption;
  status?: StatusOption;
  from?: string;
  to?: string;
  token: string | null;
  apiBase: string;
}

/**
 * Kiểm tra xem thông báo có thể xóa không (chỉ cho phép xóa status = "sent")
 */
export const canDeleteNotification = (notification: NotificationRow | undefined): boolean => {
  return notification?.status === "sent";
};

/**
 * Lọc chỉ lấy những thông báo có thể xóa (status = "sent")
 */
export const filterDeletableNotifications = (
  notifications: NotificationRow[],
  ids: number[]
): number[] => {
  return ids.filter((id) => {
    const notification = notifications.find((it) => it.id === id);
    return canDeleteNotification(notification);
  });
};

/**
 * Lấy danh sách thông báo có thể chọn (status = "sent")
 */
export const getSelectableNotifications = (notifications: NotificationRow[]): NotificationRow[] => {
  return notifications.filter((it) => it.status === "sent");
};

/**
 * Fetch danh sách thông báo với filter
 */
export const fetchNotifications = async (
  params: FetchNotificationsParams
): Promise<{ data: NotificationRow[]; total: number }> => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("pageSize", String(params.pageSize));
  if (params.title?.trim()) searchParams.set("title", params.title.trim());
  if (params.content?.trim()) searchParams.set("content", params.content.trim());
  if (params.type && params.type !== "all") searchParams.set("type", params.type);
  if (params.category && params.category !== "all") searchParams.set("category", params.category);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);

  const res = await fetch(`${params.apiBase}/api/notifications?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.returnCode !== 0) {
    throw new Error(data?.message || `Fetch failed (${res.status})`);
  }

  return {
    data: data.data || [],
    total: data.meta?.total || 0,
  };
};

/**
 * Fetch tất cả thông báo với filter (dùng cho chọn tất cả)
 */
export const fetchAllNotifications = async (
  params: FetchAllNotificationsParams
): Promise<NotificationRow[]> => {
  const searchParams = new URLSearchParams();
  searchParams.set("page", "1");
  searchParams.set("pageSize", "10000");
  if (params.title?.trim()) searchParams.set("title", params.title.trim());
  if (params.content?.trim()) searchParams.set("content", params.content.trim());
  if (params.type && params.type !== "all") searchParams.set("type", params.type);
  if (params.category && params.category !== "all") searchParams.set("category", params.category);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);

  const res = await fetch(`${params.apiBase}/api/notifications?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${params.token}`,
    },
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.returnCode !== 0) {
    throw new Error(data?.message || `Fetch failed (${res.status})`);
  }

  return data.data || [];
};

/**
 * Xóa một thông báo
 */
export const deleteNotification = async (
  params: DeleteNotificationParams
): Promise<{ success: boolean; message?: string }> => {
  const res = await fetch(`${params.apiBase}/api/notifications`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ notificationId: params.notificationId }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.returnCode !== 0) {
    throw new Error(data?.message || `Delete failed (${res.status})`);
  }

  return { success: true };
};

/**
 * Xóa nhiều thông báo
 */
export const deleteMultipleNotifications = async (
  params: DeleteMultipleNotificationsParams
): Promise<{ affected: number }> => {
  const res = await fetch(`${params.apiBase}/api/notifications`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ notificationIds: params.notificationIds }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.returnCode !== 0) {
    throw new Error(data?.message || `Delete failed (${res.status})`);
  }

  return {
    affected: data?.data?.affected || params.notificationIds.length,
  };
};

/**
 * Tính toán trạng thái chọn tất cả
 */
export const calculateSelectAllState = (
  items: NotificationRow[],
  selectedIds: Set<number>
): { allSelected: boolean; someSelected: boolean } => {
  const sentItems = getSelectableNotifications(items);
  const allSelected = sentItems.length > 0 && sentItems.every((it) => selectedIds.has(it.id));
  const someSelected = sentItems.some((it) => selectedIds.has(it.id)) && !allSelected;

  return { allSelected, someSelected };
};

/**
 * Tính toán danh sách ID để chọn/bỏ chọn khi toggle select all
 */
export const calculateToggleSelectAllIds = (
  allNotifications: NotificationRow[],
  currentSelectedIds: Set<number>
): { newSelectedIds: Set<number>; count: number } => {
  const sentNotifications = getSelectableNotifications(allNotifications);
  const sentIds = sentNotifications.map((it) => it.id);

  const allSelected = sentIds.length > 0 && sentIds.every((id) => currentSelectedIds.has(id));

  const newSelectedIds = new Set(currentSelectedIds);
  if (allSelected) {
    // Bỏ chọn tất cả
    sentIds.forEach((id) => newSelectedIds.delete(id));
  } else {
    // Chọn tất cả
    sentIds.forEach((id) => newSelectedIds.add(id));
  }

  return { newSelectedIds, count: sentIds.length };
};

