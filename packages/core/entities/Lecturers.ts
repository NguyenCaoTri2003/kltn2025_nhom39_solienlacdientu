import { User } from "./Users";

export interface Lecturers {
  id: number;
  lecturer_code: string;
  users: User;
  academic_rank: string;
}

export interface StudentWithUser {
  id: number;
  users: User;
}