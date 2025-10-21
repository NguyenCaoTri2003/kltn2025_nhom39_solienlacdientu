import { API_URL } from "../constants/config";
import { getAuthToken } from "../utils/auth";

export type Semester = {
  id: number;
  name: string;
  academic_year: string;
  start_date: string | null;
  end_date: string | null;
};

export async function fetchSemesters(): Promise<Semester[]> {
  const token = await getAuthToken();

  const res = await fetch(`${API_URL}/api/semesters`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  if (json.returnCode !== 0) throw new Error(json.message);
  return json.data;
}

export function getCurrentSemester(semesters: Semester[]): Semester | null {
  const now = new Date();

  return (
    semesters.find((s) => {
      if (!s.start_date || !s.end_date) return false;
      const start = new Date(s.start_date);
      const end = new Date(s.end_date);
      return now >= start && now <= end;
    }) || null
  );
}
