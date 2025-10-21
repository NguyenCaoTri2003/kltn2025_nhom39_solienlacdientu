import { useState, useEffect } from "react";
import { fetchGrades, CourseGrade } from "../services/gradeService";
import { Semester } from "../services/semesterService";

export function useGrades(studentId: number, semesters: Semester[]) {
  const [gradesBySemester, setGradesBySemester] = useState<Record<number, CourseGrade[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    semesters.forEach(async (semester) => {
      try {
        setLoading(true);
        const grades = await fetchGrades(studentId, semester.id);
        setGradesBySemester((prev) => ({ ...prev, [semester.id]: grades }));
      } catch (error) {
        console.error("Fetch grades error:", error);
      } finally {
        setLoading(false);
      }
    });
  }, [studentId, semesters]);

  return { gradesBySemester, loading };
}
