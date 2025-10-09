export interface WeeklySchedule {
  day_of_week: number;
  start_period: number;
  period_count: number;
  classroom?: string | null;
  building?: string | null;
  type: string; 
  practice_group_id?: number | null;
}