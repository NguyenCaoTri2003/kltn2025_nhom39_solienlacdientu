import { Major } from "./Majors";

export interface Class {
    id: number; 
    name: string; 
    class_code: string; 
    academic_year?: string | null;
    class_type: string; 
    major_id?: number | null; 
    homeroom_teacher_id?: number | null;
    major?: Major;
  }


  