import { useEffect, useState } from "react";
import { fetchSemesters, getCurrentSemester } from "../services/semesterService";
import {
  fetchOfferingsBySemester,
  fetchOfferingDetail,
} from "../services/offeringService";

export function useCourseOfferings() {
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [semester, setSemester] = useState<any>(null);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadOfferingsBySemester(semesterId: number) {
    try {
      setLoading(true);
      setError(null);
      const offerings = await fetchOfferingsBySemester(semesterId);

      if (offerings.length === 0) {
        setOfferings([]);
        setLoading(false);
        return;
      }

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

  async function initialize() {
    try {
      setLoading(true);
      const semesters = await fetchSemesters();
      setSemesters(semesters);

      const current = getCurrentSemester(semesters);
      if (current) {
        setSemester(current);
        await loadOfferingsBySemester(current.id);
      } else {
        setError("Không tìm thấy học kỳ hiện tại.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initialize();
  }, []);

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
