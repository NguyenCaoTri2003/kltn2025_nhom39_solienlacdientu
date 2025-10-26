import { useState, useEffect } from "react";
import { fetchSemesterSummary } from "../services/semesterSumaryService";

export function useSemesterSummaries(studentId: number | null, semesterIds: number[]) {
  const [summaries, setSummaries] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId || !semesterIds || semesterIds.length === 0) {
      setSummaries({});
      return;
    }

    async function loadSummaries() {
      setLoading(true);
      try {
        const results = await Promise.all(
          semesterIds.map(async (id) => {
            const res = await fetchSemesterSummary(studentId!, id);
            return { semester_id: id, summary: res.data };
          })
        );

        const summaryMap = results.reduce((acc, { semester_id, summary }) => {
          acc[semester_id] = summary;
          return acc;
        }, {} as Record<number, any>);

        setSummaries(summaryMap);
      } catch (err) {
        console.error("Fetch semester summaries failed:", err);
        setSummaries({}); 
      } finally {
        setLoading(false);
      }
    }

    loadSummaries();
  }, [studentId, JSON.stringify(semesterIds)]); 

  return { summaries, loading };
}
