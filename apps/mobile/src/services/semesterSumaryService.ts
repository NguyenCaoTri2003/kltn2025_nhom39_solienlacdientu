import { API_URL } from "../constants/config";
import { getAuthToken } from "../utils/auth";

export async function fetchSemesterSummary(student_id: number, semester_id?: number) {
  const token = await getAuthToken();
  const url = semester_id
    ? `${API_URL}/api/semester-summary?student_id=${student_id}&semester_id=${semester_id}`
    : `${API_URL}/api/semester-summary?student_id=${student_id}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  console.log("Semester Summary Response:", json);
  if (!res.ok) throw new Error(json.error || "Failed to fetch semester summary");
  return json;
}
