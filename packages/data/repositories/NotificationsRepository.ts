import { supabase } from "@packages/data/supabaseClient";
import { NotificationCategory } from "@packages/core/entities/Notifications";

export type NotificationType = "university" | "lecturer" | "system";
export type NotificationStatus = "sent" | "deleted";

export interface NotificationRow {
  id: number;
  user_id: number | null;
  title: string | null;
  content: string | null;
  type: NotificationType | null;
  category: NotificationCategory | null;
  target_student_id: number | null;
  is_read: boolean;
  is_deleted: boolean;
  created_at?: string;
  url?: string | null;
  broadcast_group_id?: string | null;
  status?: NotificationStatus | null;
}


export interface ListParams {
  userId?: number;
  page?: number;
  pageSize?: number;
}

export interface ListResult {
  items: NotificationRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class NotificationsRepository {
  /**
   * Tìm kiếm thông báo với các bộ lọc và phân trang
   * Hỗ trợ lọc theo tiêu đề, nội dung, loại, danh mục, khoảng thời gian và trạng thái
   * @returns Danh sách thông báo kèm thông tin phân trang
   */
  async search(params: {
    page?: number;
    pageSize?: number;
    title?: string;
    content?: string;
    type?: NotificationType | null;
    category?: string | null;
    from?: string; // UTC ISO
    to?: string;   // UTC ISO
    status?: NotificationStatus | null;
  }): Promise<ListResult> {
    const page = Math.max(1, Math.floor(params.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize ?? 20)));
    const fromIdx = (page - 1) * pageSize;
    const toIdx = fromIdx + pageSize - 1;

    let query = supabase
      .from("notifications")
      .select("id, user_id, title, content, type, category, target_student_id, is_read, is_deleted, created_at, url, broadcast_group_id, status", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params.title) query = query.ilike('title', `%${params.title}%`);
    if (params.content) query = query.ilike('content', `%${params.content}%`);
    if (params.type) query = query.eq('type', params.type);
    if (params.category) query = query.eq('category', params.category);
    if (params.from) query = query.gte('created_at', params.from);
    if (params.to) query = query.lte('created_at', params.to);
    if (params.status) query = query.eq('status', params.status);

    const { data, count, error } = await query.range(fromIdx, toIdx);
    if (error) throw error;

    return {
      items: (data ?? []) as NotificationRow[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
    };
  }

  /**
   * Tìm kiếm thông báo không phân trang (raw search)
   * Hỗ trợ lọc theo tiêu đề, nội dung, loại, danh mục, khoảng thời gian và trạng thái
   * @returns Mảng các thông báo (tối đa 10000 bản ghi)
   */
  async searchRaw(params: {
    title?: string;
    content?: string;
    type?: NotificationType | null;
    category?: string | null;
    from?: string; // UTC ISO
    to?: string;   // UTC ISO
    limit?: number;
    status?: NotificationStatus | null;
  }): Promise<NotificationRow[]> {
    let query = supabase
      .from("notifications")
      .select("id, user_id, title, content, type, category, target_student_id, is_read, is_deleted, created_at, url, broadcast_group_id, status")
      .order("created_at", { ascending: false })
      .limit(Math.max(1, Math.min(10000, Math.floor(params.limit ?? 2000))));

    if (params.title) query = query.ilike('title', `%${params.title}%`);
    if (params.content) query = query.ilike('content', `%${params.content}%`);
    if (params.type) query = query.eq('type', params.type);
    if (params.category) query = query.eq('category', params.category);
    if (params.from) query = query.gte('created_at', params.from);
    if (params.to) query = query.lte('created_at', params.to);
    if (params.status) query = query.eq('status', params.status);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as NotificationRow[];
  }

  /**
   * Tạo một thông báo mới
   * Mặc định status = "sent" nếu không được chỉ định
   * @returns Thông báo vừa được tạo
   */
  async create(payload: {
    user_id?: number | null;
    title?: string | null;
    content?: string | null;
    type?: NotificationType | null;
    category?: NotificationCategory | null;
    target_student_id?: number | null;
    url?: string | null;
    broadcast_group_id?: string | null;
    status?: NotificationStatus | null;
  }): Promise<NotificationRow> {
    const insertData = {
      user_id: payload.user_id ?? null,
      title: payload.title ?? null,
      content: payload.content ?? null,
      type: payload.type ?? null,
      category: payload.category ?? null,
      target_student_id: payload.target_student_id ?? null,
      url: payload.url ?? null,
      broadcast_group_id: payload.broadcast_group_id ?? null,
      status: payload.status ?? "sent",
    } as const;
    const { data, error } = await supabase
      .from("notifications")
      .insert(insertData)
      .select("id, user_id, title, content, type, category, target_student_id, is_read, is_deleted, created_at, url, broadcast_group_id, status")
      .single();
    if (error) throw error;
    return data as NotificationRow;
  }

  /**
   * Tạo nhiều thông báo cùng lúc (bulk insert)
   * Mặc định status = "sent" cho tất cả các thông báo nếu không được chỉ định
   * @returns Số lượng thông báo đã được tạo thành công
   */
  async createBulk(rows: Array<{
    user_id?: number | null;
    title?: string | null;
    content?: string | null;
    type?: NotificationType | null;
    category?: NotificationCategory | null;
    target_student_id?: number | null;
    url?: string | null;
    broadcast_group_id?: string | null;
    status?: NotificationStatus | null;
  }>): Promise<number> {
    if (!rows || rows.length === 0) return 0;
    const { data, error } = await supabase
      .from("notifications")
      .insert(rows.map(r => ({
        user_id: r.user_id ?? null,
        title: r.title ?? null,
        content: r.content ?? null,
        type: r.type ?? null,
        category: r.category ?? null,
        target_student_id: r.target_student_id ?? null,
        url: r.url ?? null,
        broadcast_group_id: r.broadcast_group_id ?? null,
        status: r.status ?? "sent",
      })))
      .select("id");
    if (error) throw error;
    return (data?.length ?? 0);
  }

  /**
   * Lấy thông báo theo ID
   * @returns Thông báo tương ứng với ID, hoặc null nếu không tìm thấy
   */
  async getById(id: number): Promise<NotificationRow | null> {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, title, content, type, category, target_student_id, is_read, is_deleted, created_at, url, broadcast_group_id, status")
      .eq("id", id)
      .single();
    if (error) {

      if ((error as any).code === "PGRST116" || String(error.message || "").toLowerCase().includes("not found")) {
        return null;
      }
      throw error;
    }
    return data as NotificationRow;
  }

  /**
   * Lấy danh sách thông báo có phân trang
   * Có thể lọc theo user_id
   * @returns Danh sách thông báo kèm thông tin phân trang
   */
  async list(params: ListParams = {}): Promise<ListResult> {
    const page = Math.max(1, Math.floor(params.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize ?? 20)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("notifications")
      .select("id, user_id, content, type, category, created_at, url, broadcast_group_id, status", { count: "exact" })
      .order("created_at", { ascending: false });

    if (params.userId != null) {
      query = query.eq("user_id", params.userId);
    }

    const { data, count, error } = await query.range(from, to);
    if (error) throw error;

    return {
      items: (data ?? []) as NotificationRow[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
    };
  }

  /**
   * Xóa vĩnh viễn một thông báo khỏi database
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw error;
  }

  /**
   * Lấy danh sách thông báo của một user cụ thể có phân trang
   * Chỉ lấy các thông báo chưa bị xóa (is_deleted = false)
   * @returns Danh sách thông báo của user kèm thông tin phân trang
   */
  async getUserNotifications(userId: number, params: ListParams = {}): Promise<ListResult> {
    const page = Math.max(1, Math.floor(params.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize ?? 20)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from("notifications")
      .select(`
        id, user_id, title, content, type, category, target_student_id, 
        is_read, is_deleted, created_at, url, broadcast_group_id, status
      `, { count: "exact" })
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      items: (data ?? []) as any[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
    };
  }

  /**
   * Đánh dấu một thông báo là đã đọc
   * Cập nhật is_read = true cho thông báo có ID tương ứng
   */
  async markAsRead(notificationId: number): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    if (error) throw error;
  }

  /**
   * Đánh dấu một thông báo là đã xóa (soft delete)
   * Cập nhật is_deleted = true cho thông báo có ID tương ứng
   */
  async markAsDeleted(notificationId: number): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_deleted: true })
      .eq("id", notificationId);
    if (error) throw error;
  }

  /**
   * Đánh dấu tất cả thông báo chưa đọc của một user là đã đọc
   * Cập nhật is_read = true cho tất cả thông báo của user có is_read = false
   */
  async markAllAsRead(userId: number): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw error;
  }

  /**
   * Đánh dấu tất cả thông báo chưa xóa của một user là đã xóa (soft delete)
   * Cập nhật is_deleted = true cho tất cả thông báo của user có is_deleted = false
   */
  async deleteAll(userId: number): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_deleted: true })
      .eq("user_id", userId)
      .eq("is_deleted", false);
    if (error) throw error;
  }

  /**
   * Xóa nhiều notifications theo danh sách IDs
   * Cập nhật status thành 'deleted', is_deleted = true, is_read = true
   */
  async deleteMultiple(notificationIds: number[]): Promise<number> {
    if (!notificationIds || notificationIds.length === 0) return 0;
    

    const { data: notifications, error: fetchError } = await supabase
      .from("notifications")
      .select("id, broadcast_group_id, status")
      .in("id", notificationIds);
    
    if (fetchError) throw fetchError;
    if (!notifications || notifications.length === 0) return 0;

    const alreadyDeleted = notifications.filter(n => n.status === 'deleted');
    if (alreadyDeleted.length > 0) {
      const deletedIds = alreadyDeleted.map(n => n.id).join(', ');
      throw new Error(`Không thể xóa các thông báo đã bị xóa. Vui lòng kiểm tra lại.`);
    }

    const groupIds = new Set<string>();
    const individualIds: number[] = [];
    
    for (const notif of notifications) {
      if (notif.broadcast_group_id) {
        groupIds.add(notif.broadcast_group_id);
      } else {
        individualIds.push(notif.id);
      }
    }

    let affectedCount = 0;

    if (groupIds.size > 0) {
      const { data: groupDeleted, error: groupError } = await supabase
        .from("notifications")
        .update({ is_deleted: true, is_read: true, status: "deleted" })
        .in("broadcast_group_id", Array.from(groupIds))
        .select("id");
      
      if (groupError) throw groupError;
      affectedCount += groupDeleted?.length || 0;
    }

    if (individualIds.length > 0) {
      const { data: individualDeleted, error: individualError } = await supabase
        .from("notifications")
        .update({ is_deleted: true, is_read: true, status: "deleted" })
        .in("id", individualIds)
        .select("id");
      
      if (individualError) throw individualError;
      affectedCount += individualDeleted?.length || 0;
    }

    return affectedCount;
  }

}
