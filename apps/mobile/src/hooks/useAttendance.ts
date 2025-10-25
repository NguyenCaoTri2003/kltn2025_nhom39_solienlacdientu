import { useEffect, useState } from "react";
import { fetchAttendanceByOffering, AttendanceRecord } from "../services/attendanceService";

export function useAttendance(studentId: number, offeringId: number) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId || !offeringId) return;

    let isMounted = true;
    setLoading(true);

    fetchAttendanceByOffering(studentId, offeringId)
      .then((data) => {
        if (isMounted) setAttendance(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [studentId, offeringId]);

  return { attendance, loading, error };
}
