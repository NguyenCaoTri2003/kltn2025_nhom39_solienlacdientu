export type Role = "STUDENT" | "PARENT" | "LECTURER" | "ADMIN";

export interface User {
  id: number;
  full_name: string;
  password_hash: string;
  role: Role;
  phone: string;
  email: string;
  status: string;
  citizen_id_card?: string;
  address?: string;
  ethnic?: string;
  created_at?: string;
  last_login?: string;
}