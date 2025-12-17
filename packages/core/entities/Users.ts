export type Role = "student" | "parent" | "lecturer" | "admin";
export type AdminType =
  | "super_admin"
  | "admin_account"
  | "admin_academic"
  | "admin_finance"
  | "admin";

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
  admin_type?: AdminType | null;
  created_at?: string;
  last_login?: string;
}

export type UserPublic = Omit<User, "password_hash">;