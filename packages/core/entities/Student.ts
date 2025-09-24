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
}

export interface StudentWithUser {
  id: string;
  users: User;
}