import { API_URL } from "../constants/config";

export const appointmentService = {
    async createAppointment(token: string, payload: {
        studentId: number;
        lecturerId: number;
        title: string;
        content: string;
        start_time: string;
        end_time: string;
        location?: string;
    }) {
        const res = await fetch(`${API_URL}/api/appointments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const raw = await res.text();

        try {
            const data = JSON.parse(raw);
            if (!res.ok) throw new Error(data.error || "Không thể tạo lịch hẹn");
            return data;
        } catch (e) {
            console.error("Parse JSON error:", e);
            throw new Error("Phản hồi từ server không hợp lệ. Có thể URL hoặc API bị lỗi.");
        }
    },
};