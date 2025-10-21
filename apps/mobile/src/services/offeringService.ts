import { API_URL } from "../constants/config";
import { getAuthToken } from "../utils/auth";

export type Offering = {
  id: number;
  name: string;
  class_code: string;
  status: string;
  has_practice: boolean;
  semester: {
    id: number;
    name: string;
    academic_year: string;
  };
};

export async function fetchOfferingsBySemester(semesterId: number): Promise<Offering[]> {
  const token = await getAuthToken();

  const res = await fetch(`${API_URL}/api/offerings/student?semester_id=${semesterId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  if (json.returnCode !== 0) throw new Error(json.message);
  return json.data;
}

export async function fetchOfferingDetail(id: number) {
  const token = await getAuthToken();

  const res = await fetch(`${API_URL}/api/offerings/student/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  if (json.returnCode !== 0) throw new Error(json.message);
  return json.data;
}
