import { AttendanceRepository } from "@/data/repositories/AttendanceRepository";
import { supabase } from "@/data/supabaseClient";
import { AuthorizationService } from "../services/authorization/AuthorizationService";

export class AttendanceUseCase {
    constructor(private repo: AttendanceRepository) { }

    async getStudentAttendance(studentId: number, user: any, startDate?: string, endDate?: string, offeringId?: number) {
        if (!(await AuthorizationService.canViewStudent(user, studentId))) {
            throw new Error("Forbidden");
        }

        if (offeringId) {
            const { data: enrollment, error } = await supabase
                .from("enrollment")
                .select("id")
                .eq("student_id", studentId)
                .eq("offering_id", offeringId)
                .maybeSingle();

            console.log(enrollment, error);

            if (error) throw error;
            if (!enrollment) {
                throw new Error("Forbidden");
            }
        }

        return this.repo.getStudentAttendance(studentId, startDate, endDate, offeringId);
    }

    async getOfferingAttendance(
        lecturerId: number,
        offeringId: number,
        date?: string
    ) {
        const { data: offering } = await supabase
            .from("course_offerings")
            .select("id, lecturer_id")
            .eq("id", offeringId)
            .maybeSingle();

        if (!offering || offering.lecturer_id !== lecturerId) {
            throw new Error("Forbidden");
        }

        return this.repo.getOfferingAttendance(offeringId, date);
    }

    async createAttendance(
        lecturerId: number,
        offeringId: number,
        record: {
            enrollment_id: number;
            practice_group_id?: number | null;
            attendance_date: string;
            type: string;
            status: string;
            note?: string | null;
        }
    ) {
        // Check offering có thuộc giảng viên không
        const { data: offering, error: offeringError } = await supabase
            .from("course_offerings")
            .select("id, lecturer_id")
            .eq("id", offeringId)
            .maybeSingle();

        if (offeringError) throw offeringError;
        if (!offering || offering.lecturer_id !== lecturerId) {
            throw new Error("Forbidden");
        }

        // Check enrollment thuộc offering này không
        const { data: enrollment, error: enrollError } = await supabase
            .from("enrollment")
            .select("id, offering_id")
            .eq("id", record.enrollment_id)
            .maybeSingle();

        if (enrollError) throw enrollError;
        if (!enrollment || enrollment.offering_id !== offeringId) {
            throw new Error("Enrollment does not belong to this offering");
        }

        return this.repo.createAttendance(record);
    }

    async updateAttendance(
        lecturerId: number,
        offeringId: number,
        attendanceId: number,
        updates: Partial<{ status: string; note: string }>
    ) {
        const { data: offering } = await supabase
            .from("course_offerings")
            .select("id, lecturer_id")
            .eq("id", offeringId)
            .maybeSingle();

        if (!offering || offering.lecturer_id !== lecturerId) {
            throw new Error("Forbidden");
        }

        return this.repo.updateAttendance(attendanceId, updates);
    }

    async deleteAttendance(
        lecturerId: number,
        offeringId: number,
        attendanceId: number
    ) {
        const { data: offering } = await supabase
            .from("course_offerings")
            .select("id, lecturer_id")
            .eq("id", offeringId)
            .maybeSingle();

        if (!offering || offering.lecturer_id !== lecturerId) {
            throw new Error("Forbidden");
        }

        return this.repo.deleteAttendance(attendanceId);
    }
}
