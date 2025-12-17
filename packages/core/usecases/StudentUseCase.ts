import { StudentRepository } from "@packages/data/repositories/StudentRepository"
import { GradeRepository } from "@packages/data/repositories/GradeRepository"
import { Student } from "../entities/Student";
import { ClassesRepository } from "@packages/data/repositories/ClassesRepository";

export class StudentUseCase {
    constructor(
        private studentRepo: StudentRepository,
        private gradeRepo: GradeRepository,
        private classRepo: ClassesRepository
    ) { }

    async getStudentDetailForLecturer(
        lecturerId: number,
        offeringId: number,
        studentId: number
    ) {
        try {
            const offering = await this.studentRepo.getOfferingLecturer(offeringId)

            if (!offering) {
                return {
                    returnCode: 1,
                    message: "Lớp học phần không tồn tại.",
                    data: null,
                }
            }

            const isLecturerOfOffering = offering.lecturer_id === lecturerId;

            const practiceGroups = await this.studentRepo.getPracticeGroupsByOfferingAndLecturer(offeringId, lecturerId);
            const isPracticeLecturer = practiceGroups?.length > 0;

            if (!isLecturerOfOffering && !isPracticeLecturer) {
                return {
                    returnCode: 1,
                    message: "Bạn không có quyền xem sinh viên này.",
                    data: null,
                }
            }

            const studentInfo = await this.studentRepo.getStudentInOffering(
                offeringId,
                studentId
            )

            if (!studentInfo || !studentInfo.students) {
                return {
                    returnCode: 1,
                    message: "Không tìm thấy sinh viên trong lớp học phần này.",
                    data: null,
                }
            }

            const grades = await this.gradeRepo.getStudentGradesInOffering(
                studentId,
                offeringId
            )

            const student = Array.isArray(studentInfo.students)
                ? studentInfo.students[0]
                : studentInfo.students

            const user = Array.isArray(student.users)
                ? student.users[0]
                : student.users


            const data = {
                student: {
                    id: student.id,
                    full_name: user?.full_name,
                    student_code: student.student_code,
                    date_of_birth: student.date_of_birth,
                    contact_address: student.contact_address,
                    class: student.classes
                        ? Array.isArray(student.classes)
                            ? (student.classes[0] as any)?.name
                            : (student.classes as any)?.name
                        : null,
                    academic_status: student.academic_status,
                    type_of_tranning: student.type_of_tranning,
                    training_level: student.training_level,
                    academic_year: student.academic_year,
                    citizen_id_card: user?.citizen_id_card,
                    ethnic: user?.ethnic,
                    avatar_url: user?.avatar_url,
                    place_of_birth: student.place_of_birth,
                },
                parents:
                    student.student_parent?.map((sp: any) => {
                        const parent = Array.isArray(sp.parents) ? sp.parents[0] : sp.parents
                        const parentUser = Array.isArray(parent?.users)
                            ? parent.users[0]
                            : parent?.users

                        return {
                            relation: sp.relationship,
                            name: parentUser?.full_name,
                            phone: parentUser?.phone,
                            email: parentUser?.email,
                            occupation: parent?.occupation,
                        }
                    }) ?? [],
                grades,
                offering: {
                    id: offering.id,
                    lecturer_id: offering.lecturer_id,
                    name: offering.name
                },
                practice_groups:
                    grades?.practice_group ??
                    null,
            }

            return {
                returnCode: 0,
                message: "OK",
                data,
            }
        } catch (error: any) {
            console.error(" [StudentUseCase.getStudentDetailForLecturer]", error)
            return {
                returnCode: 1,
                message: error.message || "Lỗi khi lấy thông tin sinh viên.",
                data: null,
            }
        }
    }

    async getStudentsWithParentsByClassForLecturer(classId: number, lecturerId: number): Promise<Student[]> {
        const classInfo = await this.classRepo.getClassById(classId);
        if (!classInfo) {
            throw new Error("Class not found");
        }

        if (classInfo.homeroom_teacher_id !== lecturerId) {
            const err: any = new Error("Bạn không có quyền xem lớp này");
            err.status = 403;
            throw err;
        }

        const students = await this.studentRepo.getStudentsWithParentsByClass(classId);
        return students;
    }

    async getStudentDetailForClass(studentId: number, classId: number) {
        const student = await this.studentRepo.getHomeroomStudentDetail({ studentId, classId });

        if (!student) {
            throw new Error("Không tìm thấy sinh viên");
        }

        return {
            id: student.id,
            student_code: student.student_code,
            academic_status: student.academic_status,
            academic_year: student.academic_year,
            date_of_birth: student.date_of_birth,
            place_of_birth: student.place_of_birth,
            contact_address: student.contact_address,
            type_of_tranning: student.type_of_tranning,
            training_level: student.training_level,
            class: student.classes
                ? Array.isArray(student.classes)
                    ? (student.classes[0] as any)?.name
                    : (student.classes as any)?.name
                : null,

            user: student.users,

            parents: (student.student_parent || []).map((sp: any) => ({
                id: sp.parents.id,
                relationship: sp.relationship,
                occupation: sp.parents.occupation,
                user: sp.parents.users,
            })),
        };
    }

    async getAttendanceViolations(studentId: number) {
        if (!this.studentRepo) {
            throw new Error("StudentRepository not provided");
        }

        const [theory, practice] = await Promise.all([
            this.studentRepo.getTheoryAbsentByStudent(studentId),
            this.studentRepo.getPracticeAbsentByStudent(studentId),
        ]);

        return {
            student_id: studentId,
            hasViolation: theory.length > 0 || practice.length > 0,

            theoryViolations: theory.map((t: any) => ({
                offeringId: t.offering_id,
                offeringName: t.offering_name,
                classCode: t.class_code,
                lecturerName: t.lecturer_name,
                absentDays: t.absent_days,
                type: "theory",
                reason: `Vắng ${t.absent_days} buổi lý thuyết`,
            })),

            practiceViolations: practice.map((p: any) => ({
                offeringId: p.offering_id,
                offeringName: p.offering_name,
                classCode: p.class_code,
                lecturerName: p.lecturer_name,
                practiceGroupId: p.practice_group_id,
                groupNumber: p.group_number,
                absentDays: p.absent_days,
                type: "practice",
                reason: `Vắng ${p.absent_days} buổi thực hành (Nhóm ${p.group_number})`,
            })),
        };
    }
}
