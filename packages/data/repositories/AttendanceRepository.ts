import { supabase } from "../supabaseClient";

export class AttendanceRepository {
    async getStudentAttendance(
        studentId: number,
        startDate?: string,
        endDate?: string,
        offeringId?: number
    ) {
        let enrollmentQuery = supabase
            .from("enrollment")
            .select("id, offering_id")
            .eq("student_id", studentId);

        if (offeringId) {
            enrollmentQuery = enrollmentQuery.eq("offering_id", offeringId);
        }

        const { data: enrollments, error: enrollErr } = await enrollmentQuery;
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
            .order("type", { ascending: true });

        if (startDate) query = query.gte("attendance_date", startDate);
        if (endDate) query = query.lte("attendance_date", endDate);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

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

    async deleteAttendance(attendanceId: number) {
        const { error } = await supabase.from("attendance").delete().eq("id", attendanceId);
        if (error) throw error;
        return true;
    }

    async upsertAttendance(record: {
        enrollment_id: number;
        attendance_date: string;
        type: string;
        practice_group_id?: number | null;
        status: string;
        note?: string | null;
    }) {
        const conflictColumns =
            record.practice_group_id === null
                ? "enrollment_id,attendance_date,type"
                : "enrollment_id,attendance_date,type,practice_group_id";

        const { data, error } = await supabase
            .from("attendance")
            .upsert(record, {
                onConflict: conflictColumns,
            })
            .select(`
      *,
      enrollment:enrollment_id (
        id,
        student_id,
        offering_id
      )
    `)
            .single();

        if (error) throw error;
        return data;
    }

}
