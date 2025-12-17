export type ScheduleItem = {
  practice_group: {
    group_number: string;
  };
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
  };
};

// Lịch tuần / theo khoảng ngày của sinh viên
export async function fetchStudentSchedule(
  studentId: number | null | undefined,
  startDate?: string,
  endDate?: string
): Promise<ScheduleItem[]> {
  const params = new URLSearchParams();
  const token = localStorage.getItem("token");

  params.append("student_id", String(studentId));
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/schedules?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) throw new Error("Failed to fetch schedule");
  return res.json();
}

// ---- Lịch dạy của giảng viên (giống cấu trúc actual_schedules + course_offering) ----

export type LecturerScheduleItem = {
  id: number;
  offering_id: number;
  practice_group_id: number | null;
  schedule_date: string;
  start_period: number;
  period_count: number;
  classroom: string | null;
  building: string | null;
  type: string;
  status: string;
  note: string | null;
  course_offering: {
    id: number;
    name: string;
    class_code: string;
    class?: {
      id: number;
      name: string;
      class_code: string;
    } | null;
  };
};

export async function fetchLecturerSchedule(
  lecturerId: number | null | undefined,
  startDate?: string,
  endDate?: string
): Promise<LecturerScheduleItem[]> {
  if (!lecturerId) return [];

  const params = new URLSearchParams();
  const token = localStorage.getItem("token");

  params.append("lecturer_id", String(lecturerId));
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/schedules/lecturer?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch lecturer schedule");
  }

  return res.json();
}