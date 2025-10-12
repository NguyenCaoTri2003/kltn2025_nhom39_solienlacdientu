export type ChangeType =
  | "update_information"
  | "status_change"
  | "password_change"
  | "reset_password";

export interface UserAuditLog {
  id: number;
  user_id: number; 
  changed_by: number | null; 
  change_type: ChangeType;
  changes: Record<string, any>; 
  created_at: string; 
}

export interface CreateUserAuditLogInput {
  user_id: number;
  changed_by?: number | null;
  change_type: ChangeType;
  changes: Record<string, any>;
}
