import { supabase } from "../supabaseClient";

export class ClassesRepository {
  async getClassesByMajor(majorId: number) {
    const { data, error } = await supabase
      .from("classes")
      .select(
        "id, name, class_code, academic_year, class_type, major_id, homeroom_teacher_id"
      )
      .eq("major_id", majorId);

    if (error) throw error;
    return data ?? [];
  }

  async getAllClasses() {
    const { data, error } = await supabase
      .from("classes")
      .select("id, class_code");

    if (error) throw error;
    return data ?? [];
  }
}


