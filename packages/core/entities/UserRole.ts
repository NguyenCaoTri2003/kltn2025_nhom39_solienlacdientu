import { JSX } from "react/jsx-runtime";
import { Class } from "./Classes";

export type Student = {
  id: number;
  student_code: string;
  class_id: number | null;
  academic_status: string;
  date_of_birth: string | null;
  place_of_birth: string | null;
  contact_address: string | null;
  type_of_tranning: string;
  training_level: string;
  academic_year: string;
  classes?: Class;
};

export type Parent = {
  id: number;
  occupation?: string;
};

type Children = {
    id: number;
    users: User;
    classes?: {
        class_code?: string;
    };
    student_code: string;
    relationship?: string;
    academic_year?: string;
}

export type User = {
  id: number;
  full_name: string;
  role: "student" | "parent" | "lecturer" | string;
  email: string;
  phone: string;
  status: string;
  address: string;
  avatar_url: string | null;
  student?: Student;
  parent?: Parent;
  children?: Children[];
  citizen_id_card?: string;
  ethnic?: string;
};