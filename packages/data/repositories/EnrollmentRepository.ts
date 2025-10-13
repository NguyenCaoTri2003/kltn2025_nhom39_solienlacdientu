import { supabase } from "../supabaseClient";

export class EnrollmentRepository {
  async getStudentsByOffering(offeringId: number) {
    try {
      const { data, error } = await supabase
        .from("enrollment")
        .select(`
        id,
        registered_at,
        students:student_id (
          id,
          student_code,
          academic_status,
          academic_year,
          type_of_tranning,
          training_level,
          class_id,
          users:users!students_id_fkey (
            full_name,
            email,
            phone,
            avatar_url
          ),
          student_parent (
            relationship,
            parents:parent_id (
              id,
              occupation,
              users:users!parents_id_fkey (
                full_name,
                email,
                phone
              )
            )
          )
        )
      `)
        .eq("offering_id", offeringId);

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      console.log("Query result:", data);
      return data ?? [];
    } catch (err) {
      console.error("Repository error:", err);
      throw err;
    }
  }

  /**
   * Lấy danh sách sinh viên trong lớp học phần kèm nhóm thực hành
   */
  // async getStudentsByOffering(offeringId: number) {
  //   try {
  //     const { data, error } = await supabase
  //       .from("enrollment")
  //       .select(
  //         `
  //         id,
  //         student_id,
  //         registered_at,
  //         students:student_id (
  //           id,
  //           student_code,
  //           academic_status,
  //           academic_year,
  //           type_of_tranning,
  //           training_level,
  //           class_id,
  //           users:users!students_id_fkey (
  //             full_name,
  //             email,
  //             phone,
  //             avatar_url
  //           ),
  //           student_parent (
  //             relationship,
  //             parents:parent_id (
  //               id,
  //               occupation,
  //               users:users!parents_id_fkey (
  //                 full_name,
  //                 email,
  //                 phone
  //               )
  //             )
  //           )
  //         ),
  //         practice_enrollment:practice_enrollment!practice_enrollment_enrollment_id_fkey (
  //           group_id,
  //           practice_groups:group_id (
  //             id,
  //             group_number,
  //             lecturer_id
  //           )
  //         )
  //       `
  //       )
  //       .eq("offering_id", offeringId);

  //     if (error) {
  //       console.error("Database error:", error);
  //       throw error;
  //     }

  //     // Chuẩn hóa dữ liệu gọn cho frontend
  //     const mapped = (data ?? []).map((e: any) => ({
  //       enrollment_id: e.id,
  //       student_id: e.students?.id,
  //       student_code: e.students?.student_code,
  //       full_name: e.students?.users?.full_name,
  //       phone: e.students?.users?.phone,
  //       email: e.students?.users?.email,
  //       avatar_url: e.students?.users?.avatar_url,
  //       academic_status: e.students?.academic_status,
  //       training_level: e.students?.training_level,
  //       type_of_tranning: e.students?.type_of_tranning,
  //       class_id: e.students?.class_id,
  //       practice_group_id: e.practice_enrollment?.practice_groups?.id ?? null,
  //       practice_group_number:
  //         e.practice_enrollment?.practice_groups?.group_number ?? null,
  //     }));

  //     console.log("Query result:", mapped);
  //     return mapped;
  //   } catch (err) {
  //     console.error("Repository error:", err);
  //     throw err;
  //   }
  // }

  async getStudentsByPracticeGroup(groupId: number) {
    try {
      console.log("Getting students for practice group:", groupId);

      const { data, error } = await supabase
        .from("practice_enrollment")
        .select(`
          *,
          enrollment (
            student_id
          )
        `)
        .eq("group_id", groupId);

      if (error) {
        console.error("Practice group database error:", error);
        throw error;
      }

      console.log("Practice group query result:", data);
      return data ?? [];
    } catch (err) {
      console.error("Practice group repository error:", err);
      throw err;
    }
  }
}
