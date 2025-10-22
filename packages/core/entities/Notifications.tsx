// Aligned with DB enum public.notification_type_enum
// Values: 'university' | 'lecturer' | 'system'
export type NotificationType = "university" | "lecturer" | "system";

export interface Notification {
  id: number; 
  user_id: number | null; 
  content: string | null; 
  type: NotificationType | null; 
  created_at?: string; 
}
