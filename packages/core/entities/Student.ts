import { Grade } from "./Grade";
import { Parent } from "./Parent";
import { StudentParent } from "./StudentParent";
import { User } from "./Users";

export interface Student {
  id: number;
  student_code: string;
  class_id: number;
  academic_status: string;
  date_of_birth?: string;
  place_of_birth?: string;
  contact_address?: string;
  type_of_training: string;
  training_level: string;
  academic_year: string;
  student_parent?: StudentParent[];
  users?: User;
}

export interface StudentWithUser {
  id: string;
  users: User;
}

export interface StudentDetailData {
  student: {
    id: number;
    full_name: string;
    student_code: string;
    date_of_birth: string;
    contact_address: string;
    place_of_birth: string;
    academic_status: string;
    type_of_tranning: string;
    training_level: string;
    academic_year: string;
    email: string | null;
    phone: string | null;
    class_id: number;
    class: string;
    citizen_id_card: string | null;
    ethnic: string | null;
  };
  parents: Parent[];
  grades?: {
    theoryScores?: Grade[];
    practiceScores?: Grade[];
    summary?: {
      total_score: number | null;
      gpa4: number | null;
      letter_grade: string | null;
      classification: string | null;
      passed: boolean | null;
      note: string | null;
    };
  };
  offering: {
    id: number;
    lecturer_id: number | null;
    name: string;
  };
  practice_groups: {
    id: number;
    lecturer_id: number | null;
    group_number: number;
  };
  faculty: {
    id: number;
    name: string;
    faculty_code: string;
    description?: string | null;
  };
  major: {
    id: number;
    name: string;
    major_code: string;
    description?: string | null;
    faculty_id: number;
  };
  class: {
    id: number;
    name: string;
    class_code: string;
    academic_year?: string | null;
    class_type: string;
    major_id?: number | null;
    homeroom_teacher_id?: number | null;
  };
  semester: {
    id: number; 
    name: string;
    academic_year: string;
    start_date?: string;
    end_date?: string;
  };  
   notification: {
    id: number; 
    user_id: number | null; 
    content: string | null; 
    type: "system" | "academic_warning" | "violation" | string; 
    created_at?: string; 
  }
  
  
}
