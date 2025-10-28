import { API_URL } from "../constants/config";

export const appointmentService = {
    async getAppointments(token: string) {
        const res = await fetch(`${API_URL}/api/appointments`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Không thể tải lịch hẹn");
        return data;
    },

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

    async updateAppointment(
        token: string,
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
        const res = await fetch(`${API_URL}/api/appointments`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ id, ...updates }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Không thể cập nhật lịch hẹn");
        return data;
    },
};