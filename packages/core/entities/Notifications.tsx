export type NotificationType = "system" | "academic_warning" | "violation" | string;

export interface Notification {
  id: number; 
  user_id: number | null; 
  content: string | null; 
  type: NotificationType | null; 
  created_at?: string; 
}
