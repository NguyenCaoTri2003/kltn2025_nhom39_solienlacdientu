import { API_URL } from "../constants/config";
import { getAuthToken } from "../utils/auth";

export type AttendanceRecord = {
  id: number;
  attendance_date: string;
  type: string;
  status: string;
  note?: string;
  offering: {
    id: number;
    name: string;
    class_code: string;
  };
};

export async function fetchAttendanceByOffering(
  studentId: number,
  offeringId: number
) {
  const token = await getAuthToken();

  const url = new URL(`${API_URL}/api/attendance`);
  url.searchParams.append("student_id", String(studentId));
  url.searchParams.append("offering_id", String(offeringId));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  if (json.returnCode !== 0) throw new Error(json.message);
  return json.data as AttendanceRecord[];
}
