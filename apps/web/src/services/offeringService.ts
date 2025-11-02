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

export async function fetchOfferingsBySemesterWithStudent(semesterId: number, studentId?: number) {
  const token = localStorage.getItem("token");

  const query = new URLSearchParams({
    semester_id: String(semesterId),
  });
  if (studentId) query.append("student_id", String(studentId));

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offerings/student?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  if (json.returnCode !== 0) throw new Error(json.message);
  return json.data;
}

export async function fetchOfferingDetailWithStudent(offeringId: number, studentId?: number) {
  const token = localStorage.getItem("token");

  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/offerings/student/detail-offering`);
  url.searchParams.append("offering_id", String(offeringId));
  if (studentId) url.searchParams.append("student_id", String(studentId));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  if (json.returnCode !== 0) throw new Error(json.message);
  return json.data;
}
