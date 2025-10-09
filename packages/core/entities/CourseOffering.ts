import { Course } from "./Courses";
import { Enrollment } from "./Enrollment";
import { Lecturers } from "./Lecturers";
import { PracticeGroup } from "./PracticeGroup";
import { Semester } from "./Semesters";
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
  semesters?: Semester | null;
  lecturers?: Lecturers;
  students: Enrollment[];
  practice_groups?: PracticeGroup[];

  is_practice_lecturer?: boolean;
  practice_group_number?: number;
}