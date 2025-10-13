import { supabase } from "../supabaseClient";
import {
  ChangeType,
  CreateUserAuditLogInput,
  UserAuditLog,
} from "@packages/core/entities/UserAuditLog";

export class UserAuditLogRepository {
  async createLog(input: CreateUserAuditLogInput): Promise<UserAuditLog> {
    const payload = {
      user_id: input.user_id,
      changed_by: input.changed_by ?? null,
      change_type: input.change_type,
      changes: input.changes,
    };

    const { data, error } = await supabase
      .from("user_audit_logs")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as UserAuditLog;
  }

  async listByUser(
    userId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ logs: UserAuditLog[]; total: number; totalPages: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("user_audit_logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);
    return { logs: (data || []) as unknown as UserAuditLog[], total, totalPages };
  }
}
