import { AppointmentRepository } from "@packages/data/repositories/AppointmentRepository";
import { supabase } from "@packages/data/supabaseClient";

export class AppointmentUseCase {
    constructor(private repo: AppointmentRepository) { }

    async lecturerCreateAppointments(
        lecturerId: number,
        studentIds: number[],
        parentIds: number[],
        title: string,
        content: string,
        start_time: string,
        end_time: string,
        location?: string
    ) {
        // Lấy danh sách phụ huynh của các học sinh
        const { data: parents, error: parentError } = await supabase
            .from("student_parent")
            .select("student_id, parent_id")
            .in("student_id", studentIds);

        if (parentError) {
            throw new Error("Lỗi khi lấy thông tin phụ huynh: " + parentError.message);
        }

        if (!parents || parents.length === 0) {
            throw new Error("Không tìm thấy phụ huynh của các học sinh này");
        }

        // Lọc ra chỉ những phụ huynh được chọn
        const records = parents
            .filter((p) => parentIds.includes(p.parent_id))
            .map((p) => ({
                lecturer_id: lecturerId,
                parent_id: p.parent_id,
                student_id: p.student_id,
                title,
                content,
                start_time,
                end_time,
                location: location ?? null,
                status: "pending",
            }));

        if (records.length === 0) {
            throw new Error("Không có phụ huynh hợp lệ để tạo lịch hẹn");
        }

        return this.repo.createAppointments(records);
    }

    // async parentCreateAppointment(
    //     parentId: number,
    //     studentId: number,
    //     lecturerId: number,
    //     title: string,
    //     content: string,
    //     start_time: string,
    //     end_time: string,
    //     location?: string
    // ) {
    //     const { data: sp } = await supabase
    //         .from("student_parent")
    //         .select("student_id, parent_id")
    //         .eq("parent_id", parentId)
    //         .eq("student_id", studentId)
    //         .maybeSingle();

    //     if (!sp) throw new Error("Bạn không phải phụ huynh của học sinh này");

    //     const { data: offeringData } = await supabase
    //         .from("course_offerings")
    //         .select("id")
    //         .eq("lecturer_id", lecturerId);

    //     if (!offeringData) {
    //         throw new Error("Không tìm thấy lớp học phần của giảng viên này");
    //     }

    //     const offeringIds = offeringData.map((o) => o.id);

    //     const { data: teaches } = await supabase
    //         .from("enrollment")
    //         .select("id")
    //         .eq("student_id", studentId)
    //         .in("offering_id", offeringIds)
    //         .maybeSingle();

    //     if (!teaches) throw new Error("Giảng viên này không dạy học sinh đó");

    //     return this.repo.createAppointments([
    //         {
    //             lecturer_id: lecturerId,
    //             parent_id: parentId,
    //             student_id: studentId,
    //             title,
    //             content,
    //             start_time,
    //             end_time,
    //             location: location ?? null,
    //             status: "pending",
    //         },
    //     ]);
    // }

    async parentCreateAppointment(
        parentId: number,
        studentId: number,
        lecturerId: number,
        title: string,
        content: string,
        start_time: string,
        end_time: string,
        location?: string
    ) {
        const { data: sp } = await supabase
            .from("student_parent")
            .select("student_id, parent_id")
            .eq("parent_id", parentId)
            .eq("student_id", studentId)
            .maybeSingle();

        if (!sp) throw new Error("Bạn không phải phụ huynh của học sinh này");

        return this.repo.createAppointments([
            {
                lecturer_id: lecturerId,
                parent_id: parentId,
                student_id: studentId,
                title,
                content,
                start_time,
                end_time,
                location: location ?? null,
                status: "pending",
            },
        ]);
    }

    async getAppointments(user: any) {
        return this.repo.getAppointmentsByUser(user.id, user.role);
    }

    async updateAppointment(
        id: number,
        updates: Partial<{
            title: string;
            content: string;
            start_time: string;
            end_time: string;
            status: string;
            location: string;
        }>
    ) {
        return this.repo.updateAppointment(id, updates);
    }

    async deleteAppointment(user: any, id: number) {
        const { data: appt, error } = await supabase
            .from("appointments")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (error) throw error;
        if (!appt) throw new Error("Không tìm thấy lịch hẹn");

        if (user.role === "lecturer" && appt.lecturer_id !== user.id) {
            throw new Error("Bạn không có quyền xóa lịch hẹn này");
        }

        if (user.role === "parent" && appt.parent_id !== user.id) {
            throw new Error("Bạn không có quyền xóa lịch hẹn này");
        }

        return this.repo.deleteAppointment(id);
    }
}
