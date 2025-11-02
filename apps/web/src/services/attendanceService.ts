export type AttendanceRecord = {
  id: number;
  attendance_date: string;
  type: string;
  status: string;
  note?: string;
  enrollment: {
    id: number;
    student_id: number;
    offering_id: number;
  };
};

export async function fetchAttendanceByOffering(
  studentId: number,
  offeringId: number
) {
  const token = localStorage.getItem("token");

  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance`);
  url.searchParams.append("student_id", String(studentId));
  url.searchParams.append("offering_id", String(offeringId));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  if (json.returnCode !== 0) throw new Error(json.message);
  return json.data as AttendanceRecord[];
}

