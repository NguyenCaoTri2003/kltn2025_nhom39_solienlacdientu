import { supabase } from "@packages/data/supabaseClient";

// Use DB enum values from public.notification_type_enum
export type NotificationType = "university" | "lecturer" | "system";

export interface NotificationRow {
  id: number;
  user_id: number | null;
  content: string | null;
  type: NotificationType | null;
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
  async create(payload: { user_id?: number | null; content?: string | null; type?: NotificationType | null }): Promise<NotificationRow> {
    const insertData = {
      user_id: payload.user_id ?? null,
      content: payload.content ?? null,
      type: payload.type ?? null,
    } as const;
    const { data, error } = await supabase
      .from("notifications")
      .insert(insertData)
      .select("id, user_id, content, type, created_at")
      .single();
    if (error) throw error;
    return data as NotificationRow;
  }

  async getById(id: number): Promise<NotificationRow | null> {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, user_id, content, type, created_at")
      .eq("id", id)
      .single();
    if (error) {
      // supabase returns error when not found as well; normalize to null
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
      .select("id, user_id, content, type, created_at", { count: "exact" })
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
}
