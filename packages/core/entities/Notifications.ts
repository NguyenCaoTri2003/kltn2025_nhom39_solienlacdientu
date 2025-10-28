
export type NotificationType = "university" | "lecturer" | "system";


export type NotificationCategory = "ACADEMIC" | "SYSTEM" | "FINANCE" | "GENERAL";

export interface Notification {
  id: number; 
  user_id: number | null; 
  title: string | null;
  content: string | null; 
  type: NotificationType | null; 
  category: NotificationCategory | null;
  target_student_id?: number | null;
  is_read?: boolean;
  is_deleted?: boolean;
  created_at?: string; 
}

