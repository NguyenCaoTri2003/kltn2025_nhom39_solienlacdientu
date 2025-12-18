export interface LecturerUser {
  full_name: string | null;
  email: string | null;
};

export interface Lecturer {
  id: number;
  lecturer_code: string;
  users: LecturerUser | null;
};

export interface PracticeGroup {
  id: number;
  group_number: number;
  lecturers?: Lecturer | Lecturer[] | null;
};

export interface CourseOffering {
  id: number;
  name: string;
  class_code: string;
  lecturers?: Lecturer | Lecturer[] | null;
  class?: {
    id: number;
    name: string;
    class_code: string;
  } | null;
};

export interface ActualSchedule {
  id: number;
  schedule_date: string;
  start_period: number;
  period_count: number;
  classroom: string | null;
  building: string | null;
  type: "theory" | "practice" | "exam";
  status: string;
  note: string | null;
  course_offering: CourseOffering | null;
  practice_group: PracticeGroup | null;
  exam_group_number?: string | null;
  exam_range_from?: string | null;
  exam_range_to?: string | null;
  exam_lecturer_ids?: number[] | null;
  exam_lecturers?: Lecturer[];
  offering_id?: number;
};

export interface ExamLecturer {
  id: number;
  full_name: string;
}

export interface ActualScheduleWithExamLecturers {
  exam_lecturers?: ExamLecturer[];
}