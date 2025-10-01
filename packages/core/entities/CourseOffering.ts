import { Course } from "./Courses";
import { WeeklySchedule } from "./WeeklySchedule";

export interface Offering {
  id: number;
  name: string;
  class_code: string;
  practice_group_count: number;
  course_code?: string;
  semester_name?: string;
  year?: string;
  capacity?: number;
  registered?: number;
  schedule?: string;
  description?: string;

  courses: Course;
  weekly_schedules?: WeeklySchedule[];
}