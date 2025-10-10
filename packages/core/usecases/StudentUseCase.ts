import { StudentRepository } from "@packages/data/repositories/StudentRepository"
import { GradeRepository } from "@packages/data/repositories/GradeRepository"

export class StudentUseCase {
    constructor(
        private studentRepo: StudentRepository,
        private gradeRepo: GradeRepository
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

            if (offering.lecturer_id !== lecturerId) {
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
                    class: student.classes ? (Array.isArray(student.classes) ? student.classes[0].name : student.classes.name) : null,
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
                    grades?.practiceGroups ??
                    grades?.practice_group_info ??
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
}
