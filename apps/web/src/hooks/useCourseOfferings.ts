import { fetchOfferingDetailWithStudent, fetchOfferingsBySemesterWithStudent } from "@/services/offeringService";
import { fetchSemestersByStudentYear, getCurrentSemester } from "@/services/semesterService";
import { useEffect, useState, useCallback } from "react";



export function useCourseOfferings(studentYear?: string, studentId?: number) {
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [semester, setSemester] = useState<any>(null);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadOfferingsBySemester = useCallback(async (semesterId: number) => {
    if (!semesterId) return;

    try {
      setLoading(true);
      setError(null);

      const offerings = await fetchOfferingsBySemesterWithStudent(semesterId, studentId);

      if (offerings.length === 0) {
        setOfferings([]);
        return;
      }

      const detailed = await Promise.all(
        offerings.map(async (o: any) => {
          const detail = await fetchOfferingDetailWithStudent(o.id, studentId);
          return { ...o, detail };
        })
      );

      setOfferings(detailed);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);

        let fromYear: number | undefined = undefined;
        if (studentYear) {
          const match = studentYear.match(/(\d{4})/);
          if (match) fromYear = Number(match[1]);
        }

        const semesters = await fetchSemestersByStudentYear(fromYear);
        setSemesters(semesters);

        const current = getCurrentSemester(semesters);
        if (current) {
          setSemester(current);
          const offerings = await fetchOfferingsBySemesterWithStudent(current.id, studentId);
          if (offerings.length === 0) {
            setOfferings([]);
          } else {
            const detailed = await Promise.all(
              offerings.map(async (o: any) => {
                const detail = await fetchOfferingDetailWithStudent(o.id, studentId);
                return { ...o, detail };
              })
            );
            setOfferings(detailed);
          }
        } else {
          setError("Không tìm thấy học kỳ hiện tại.");
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentYear, studentId]);

  return {
    semesters,
    semester,
    setSemester,
    offerings,
    loading,
    error,
    loadOfferingsBySemester,
  };
}
