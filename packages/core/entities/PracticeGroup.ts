import { Lecturers } from "./Lecturers";
import { WeeklySchedule } from "./WeeklySchedule";

export interface PracticeGroup {
    id: number;              
    offering_id: number;    
    group_number: number;    
    capacity?: number;       
    registered?: number;  
    schedule?: string;      
    lecturer_id?: number;  
    weekly_schedules: WeeklySchedule[];  
    students: PracticeGroupStudent[];
    lecturers?: Lecturers;
}
  
export interface PracticeGroupStudent {
  id: number;
  enrollment_id: number;
  group_id: number;
  assigned_at: string;
  enrollment: {
    student_id: number;
  };
}