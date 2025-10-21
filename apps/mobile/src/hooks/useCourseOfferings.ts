import { useEffect, useState } from "react";
import { fetchSemesters, getCurrentSemester } from "../services/semesterService";
import { fetchOfferingsBySemester, fetchOfferingDetail } from "../services/offeringService";

export function useCourseOfferings() {
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState<any>(null);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const semesters = await fetchSemesters();
        const current = getCurrentSemester(semesters);

        if (!current) {
          setError("Không tìm thấy học kỳ hiện tại.");
          setLoading(false);
          return;
        }

        setSemester(current);

        const offerings = await fetchOfferingsBySemester(current.id);

        // lấy chi tiết để hiển thị giảng viên + lịch học
        const detailed = await Promise.all(
          offerings.map(async (o) => {
            const detail = await fetchOfferingDetail(o.id);
            return { ...o, detail };
          })
        );

        setOfferings(detailed);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return { semester, offerings, loading, error };
}
