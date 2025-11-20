export type Semester = {
  id: number;
  name: string;
  academic_year: string;
  start_date: string | null;
  end_date: string | null;
};

export async function fetchSemestersByStudentYear(studentYear?: number): Promise<Semester[]> {
  const token = localStorage.getItem("token");
  console.log("studentYear in fetchSemestersByStudentYear:", studentYear);

  const url = studentYear
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/semesters?fromYear=${studentYear}`
    : `${process.env.NEXT_PUBLIC_API_URL}/api/semesters`;

  

  const res = await fetch(url, {
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
