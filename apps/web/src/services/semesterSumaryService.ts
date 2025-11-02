export async function fetchSemesterSummaryWithStudent(student_id: number, semester_id?: number) {
  const token = localStorage.getItem("token");
  const url = semester_id
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/semester-summary?student_id=${student_id}&semester_id=${semester_id}`
    : `${process.env.NEXT_PUBLIC_API_URL}/api/semester-summary?student_id=${student_id}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  console.log("Semester Summary Response:", json);
  if (!res.ok) throw new Error(json.error || "Failed to fetch semester summary");
  return json;
}
