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

      return data ?? [];
    } catch (err) {
      console.error("Repository error:", err);
      throw err;
    }
  }

  async getStudentsByPracticeGroup(groupId: number) {
    try {

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

      return data ?? [];
    } catch (err) {
      console.error("Practice group repository error:", err);
      throw err;
    }
  }
}
