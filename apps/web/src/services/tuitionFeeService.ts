export type TuitionFee = {
  id: number;
  fee_type: "tuition" | "other";
  fee_code?: string;
  description?: string;
  credit?: number;
  base_amount: number;
  discount_percent: number;
  discount_amount: number;
  payable_amount: number;
  register_status?: string;
  paid_date?: string;
  paid_amount: number;
  plus_amount: number;
  minus_amount: number;
  debt_amount: number;
  status: string;
  class_code?: string;
  course_name?: string;
  academic_year?: string;
  term_name?: string;
};

export async function fetchTuitionFeesBySemester(
  semesterId: number,
  studentId: number
) {
  const token = localStorage.getItem("token");
  if (!studentId) throw new Error("Student ID không hợp lệ");

  const query = new URLSearchParams({
    semester_id: String(semesterId),
    student_id: String(studentId),
  });

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/tuition-fees?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const json = await res.json();
  if (json.returnCode !== 0) throw new Error(json.message);

  return json.data as TuitionFee[];
}
