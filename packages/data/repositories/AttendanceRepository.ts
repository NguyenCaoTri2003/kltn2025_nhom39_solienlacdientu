import { supabase } from "../supabaseClient";

export class AttendanceRepository {
    // Sinh viên xem lịch sử điểm danh
    async getStudentAttendance(studentId: number, startDate?: string, endDate?: string) {
        // Lấy tất cả enrollment_id của sinh viên
        const { data: enrollments, error: enrollError } = await supabase
            .from("enrollment")
            .select("id")
            .eq("student_id", studentId);

        if (enrollError) throw enrollError;
        if (!enrollments || enrollments.length === 0) return [];

        const enrollmentIds = enrollments.map(e => e.id);

        // Lấy attendance theo enrollment_id
        let query = supabase
            .from("attendance")
            .select(`
      *,
      enrollment:enrollment_id (
        id,
        student_id,
        offering_id
      )
    `)
            .in("enrollment_id", enrollmentIds);

        if (startDate) query = query.gte("attendance_date", startDate);
        if (endDate) query = query.lte("attendance_date", endDate);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    // Giảng viên xem điểm danh của lớp
    async getOfferingAttendance(offeringId: number, date?: string) {
        const { data: enrollments, error: enrollErr } = await supabase
            .from("enrollment")
            .select("id")
            .eq("offering_id", offeringId);

        if (enrollErr) throw enrollErr;
        if (!enrollments || enrollments.length === 0) return [];

        const enrollmentIds = enrollments.map(e => e.id);

        let query = supabase
            .from("attendance")
            .select(`
      *,
      enrollment:enrollment_id (
        id,
        student_id,
        offering_id
      )
    `)
            .in("enrollment_id", enrollmentIds)
            .order("attendance_date", { ascending: true })
            .order("type", { ascending: true });

        if (date) query = query.eq("attendance_date", date);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    // Tạo bản ghi điểm danh
    async createAttendance(record: {
        enrollment_id: number;
        practice_group_id?: number | null;
        attendance_date: string;
        type: string;
        status: string;
        note?: string | null;
    }) {
        const { data, error } = await supabase
            .from("attendance")
            .insert(record)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // Cập nhật bản ghi điểm danh
    async updateAttendance(
        attendanceId: number,
        updates: Partial<{ status: string; note: string }>
    ) {
        const { data, error } = await supabase
            .from("attendance")
            .update(updates)
            .eq("id", attendanceId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    // Xoá bản ghi điểm danh
    async deleteAttendance(attendanceId: number) {
        const { error } = await supabase.from("attendance").delete().eq("id", attendanceId);
        if (error) throw error;
        return true;
    }
}
