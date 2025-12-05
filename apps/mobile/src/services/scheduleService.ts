import { API_URL } from "../constants/config";
import { getAuthToken } from "../utils/auth";

export type ScheduleItem = {
  practice_group: {
    group_number: string;
  }
  lecturer: any;
  id: number;
  offering_id: number;
  schedule_date: string;
  start_period: number;
  period_count: number;
  classroom: string;
  building: string;
  type: string;
  note: string;
  course_offering: {
    name: string;
    class_code: string;
    class_name: string;
  };
  exam_info?: {
    exam_group_number: string;
    exam_range_from: string;
    exam_range_to: string;
    lecturers: any[];
  };
};

export async function fetchStudentSchedule(
  studentId: number | null | undefined,
  startDate?: string,
  endDate?: string
): Promise<ScheduleItem[]> {
  const params = new URLSearchParams();
  const token = await getAuthToken();

  params.append("student_id", String(studentId));
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  const res = await fetch(`${API_URL}/api/schedules?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch schedule");
  return res.json();
}