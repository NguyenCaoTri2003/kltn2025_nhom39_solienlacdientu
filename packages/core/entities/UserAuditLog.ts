export type ChangeType =
  | "update_information"
  | "status_change"
  | "password_change";

export interface UserAuditLog {
  id: number;
  user_id: number; // user being changed
  changed_by: number | null; // who changed (nullable)
  change_type: ChangeType;
  changes: Record<string, any>; // JSON details of the change
  created_at: string; // ISO timestamp
}

export interface CreateUserAuditLogInput {
  user_id: number;
  changed_by?: number | null;
  change_type: ChangeType;
  changes: Record<string, any>;
}
