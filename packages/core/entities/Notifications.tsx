// Enum values inferred from existing usage; underlying DB enum is notification_type_enum
export type NotificationType = "system" | "academic_warning" | "violation" | string;

export interface Notification {
  id: number; // bigint
  user_id: number | null; // nullable fk to users.id
  content: string | null; // text nullable
  type: NotificationType | null; // enum nullable
  created_at?: string; // timestamptz, default now()
}
