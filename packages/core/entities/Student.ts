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
        id: number
        full_name: string
        student_code: string
        date_of_birth: string
        contact_address: string
    }
    parents: Parent[]
    grades?: {
        theoryScores?: Grade[]
        practiceScores?: Grade[]
        summary?: {
          total_score: number | null;
          gpa4: number | null;
          letter_grade: string | null;   
          classification: string | null;
          passed: boolean | null;
          note: string | null; 
        }
    }
}