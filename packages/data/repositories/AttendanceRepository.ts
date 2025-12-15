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

    // async upsertAttendance(record: {
    //     enrollment_id: number;
    //     attendance_date: string;
    //     type: string;
    //     practice_group_id?: number | null;
    //     status: string;
    //     note?: string | null;
    // }) {
    //     console.log("Upsert attendance record:", record);
    //     const conflictColumns =
    //         record.practice_group_id === null
    //             ? "enrollment_id,attendance_date,type"
    //             : "enrollment_id,attendance_date,type,practice_group_id";

    //     const { data, error } = await supabase
    //         .from("attendance")
    //         .upsert(record, {
    //             onConflict: conflictColumns,
    //         })
    //         .select(`
    //   *,
    //   enrollment:enrollment_id (
    //     id,
    //     student_id,
    //     offering_id
    //   )
    // `)
    //         .single();

    //     if (error) throw error;
    //     return data;
    // }

    async upsertAttendance(record: {
        enrollment_id: number;
        attendance_date: string;
        type: "theory" | "practice";
        practice_group_id?: number | null;
        status: string;
        note?: string | null;
    }) {
        console.log("Upsert attendance record:", record);

        const pgId =
            record.type === "practice" && record.practice_group_id !== undefined && record.practice_group_id !== null
                ? Number(record.practice_group_id)
                : null;

        console.log("Sanitized practice_group_id:", pgId);

        if (pgId !== null && isNaN(pgId)) {
            throw new Error("practice_group_id must be a number or null");
        }

        const matchObj: Record<string, any> = {
            enrollment_id: record.enrollment_id,
            attendance_date: record.attendance_date,
            type: record.type,
        };

        if (record.type === "practice") {
            matchObj.practice_group_id = pgId;
        }

        const { data: existing, error: selectError } = await supabase
            .from("attendance")
            .select("*")
            .match(matchObj)
            .single();

        if (selectError && selectError.code !== "PGRST116") {
            throw selectError;
        }

        if (existing) {
            const { data, error } = await supabase
                .from("attendance")
                .update({
                    status: record.status,
                    note: record.note ?? existing.note,
                })
                .eq("id", existing.id)
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
        } else {
            const insertObj: Record<string, any> = {
                ...record,
            };
            if (record.type === "practice") insertObj.practice_group_id = pgId;

            const { data, error } = await supabase
                .from("attendance")
                .insert(insertObj)
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

}
