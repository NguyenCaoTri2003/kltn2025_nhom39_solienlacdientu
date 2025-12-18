"use client";

import { useEffect, useState, useCallback } from "react";
import { TuitionFee, fetchTuitionFeesBySemester } from "@/services/tuitionFeeService";
import { fetchSemestersByStudentYear, getCurrentSemester } from "@/services/semesterService";

export function useTuitionFees(studentYear?: string, studentId?: number) {
  const [loading, setLoading] = useState(true); 
  const [semesters, setSemesters] = useState<any[]>([]);
  const [semester, setSemester] = useState<any>(null);
  const [fees, setFees] = useState<TuitionFee[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadFeesBySemester = useCallback(
    async (semesterId: number) => {
      if (!studentId) return;

      try {
        setLoading(true);
        setError(null);

        const result = await fetchTuitionFeesBySemester(semesterId, studentId);
        setFees(result);
      } catch (e: any) {
        setError(e.message);
        setFees([]);
      } finally {
        setLoading(false);
      }
    },
    [studentId]
  );

  useEffect(() => {
    if (!studentId) {
      setFees([]);
      setError(null);
      setLoading(false);
      setSemester(null);
      setSemesters([]);
      return;
    }

    async function init() {
      try {
        setLoading(true);
        setError(null);

        let fromYear: number | undefined;
        if (studentYear) {
          const match = studentYear.match(/(\d{4})/);
          if (match) fromYear = Number(match[1]);
        }

        console.log("Fetching semesters for year in useTuitionFee:", fromYear);

        const semesters = await fetchSemestersByStudentYear(fromYear);
        setSemesters(semesters);

        const current = getCurrentSemester(semesters);
        if (!current) {
          setError("Không tìm thấy học kỳ hiện tại");
          setFees([]);
          setSemester(null);
          return;
        }

        setSemester(current);

        const result = await fetchTuitionFeesBySemester(current.id, studentId);
        setFees(result);
      } catch (e: any) {
        setError(e.message);
        setFees([]);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [studentYear, studentId]);

  return {
    semesters,
    semester,
    setSemester,
    fees,
    loading,
    error,
    loadFeesBySemester,
  };
}