import { API_URL } from "../constants/config";
import { getAuthToken } from "../utils/auth";

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
};

export type Parent = {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  relationship?: string;
  address?: string;
};

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
};

export async function fetchUserById(id: number): Promise<User> {
  const token = await getAuthToken();

  const res = await fetch(`${API_URL}/api/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const json = await res.json();
  return json;
}
