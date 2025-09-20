import { supabase } from "../supabaseClient";

export class GradeRepository {
  async getGradesByStudent(studentId: string) {
    const { data, error } = await supabase
      .from("test")
      .select("subject, score")
      .eq("student_id", studentId);

    if (error) throw error;
    return data ?? [];
  }
}
