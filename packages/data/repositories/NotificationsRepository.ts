import { supabase } from "@packages/data/supabaseClient";
import { NotificationCategory } from "@packages/core/entities/Notifications";

export type NotificationType = "university" | "lecturer" | "system";

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
  async create(payload: {
    user_id?: number | null;
    title?: string | null;
    content?: string | null;
    type?: NotificationType | null;
    category?: NotificationCategory | null;
    target_student_id?: number | null;
  }): Promise<NotificationRow> {
    const insertData = {
      user_id: payload.user_id ?? null,
      title: payload.title ?? null,
      content: payload.content ?? null,
      type: payload.type ?? null,
      category: payload.category ?? null,
      target_student_id: payload.target_student_id ?? null,
    } as const;
    const { data, error } = await supabase
      .from("notifications")
      .insert(insertData)
      .select("id, user_id, title, content, type, category, target_student_id, is_read, is_deleted, created_at")
      .single();
    if (error) throw error;
    return data as NotificationRow;
  }

  async createBulk(rows: Array<{
    user_id?: number | null;
    title?: string | null;
    content?: string | null;
    type?: NotificationType | null;
    category?: NotificationCategory | null;
    target_student_id?: number | null;
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
      })))
      .select("id");
    if (error) throw error;
    return (data?.length ?? 0);
  }

  async getById(id: number): Promise<NotificationRow | null> {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, title, content, type, category, target_student_id, is_read, is_deleted, created_at")
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

  async list(params: ListParams = {}): Promise<ListResult> {
    const page = Math.max(1, Math.floor(params.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize ?? 20)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("notifications")
      .select("id, user_id, content, type, category, created_at", { count: "exact" })
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

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) throw error;
  }


  async getUserNotifications(userId: number, params: ListParams = {}): Promise<ListResult> {
    const page = Math.max(1, Math.floor(params.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Math.floor(params.pageSize ?? 20)));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await supabase
      .from("notifications")
      .select(`
        id, user_id, title, content, type, category, target_student_id, 
        is_read, is_deleted, created_at
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

  async markAsRead(notificationId: number): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
    if (error) throw error;
  }

  async markAsDeleted(notificationId: number): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_deleted: true })
      .eq("id", notificationId);
    if (error) throw error;
  }

  async markAllAsRead(userId: number): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw error;
  }

  async deleteAll(userId: number): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ is_deleted: true })
      .eq("user_id", userId)
      .eq("is_deleted", false);
    if (error) throw error;
  }

}
