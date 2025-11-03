import { useEffect, useState } from "react";
import { appointmentService } from "../services/appointmentService";

export function useAppointment(token?: string) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAppointments() {
    if (!token) return;
    try {
      setLoading(true);
      const data = await appointmentService.getAppointments(token);
      setAppointments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  async function createAppointment(payload: {
    studentId: number;
    lecturerId: number;
    title: string;
    content: string;
    start_time: string;
    end_time: string;
    location?: string;
  }) {
    if (!token) throw new Error("Chưa đăng nhập");

    try {
      setLoading(true);
      setError(null);
      const result = await appointmentService.createAppointment(token, payload);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function updateAppointment(
    id: number,
    updates: Partial<{
      title: string;
      content: string;
      start_time: string;
      end_time: string;
      location?: string;
      status?: string;
    }>
  ) {
    if (!token) throw new Error("Chưa đăng nhập");
    try {
      setLoading(true);
      const updated = await appointmentService.updateAppointment(
        token,
        id,
        updates
      );
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
      );
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return { appointments, createAppointment, fetchAppointments, updateAppointment, loading, error };
}