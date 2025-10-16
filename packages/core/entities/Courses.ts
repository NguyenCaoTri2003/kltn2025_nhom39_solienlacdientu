export interface Course {
    id: number; 
    name: string; 
    course_code: string; 
    tuition_fee?: number | null; 
    credit?: number | null; 
    description?: string | null; 
    has_practice?: boolean | null; 
    semester_id?: number | null; 
    major_id?: number | null; 
  }
  