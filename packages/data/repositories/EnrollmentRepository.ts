import { supabase } from "../supabaseClient";

export class EnrollmentRepository {
  async getStudentsByOffering(offeringId: number) {
    try {

      const { data, error } = await supabase
        .from("enrollment")
        .select("*")
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

  async getStudentsByPracticeGroup(groupId: number) {
    try {
      console.log("Getting students for practice group:", groupId);
      
      const { data, error } = await supabase
        .from("practice_enrollment")
        .select("*")
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
