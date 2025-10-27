import { useState } from "react";
import { appointmentService } from "../services/appointmentService";

export function useAppointment(token?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return { createAppointment, loading, error };
}