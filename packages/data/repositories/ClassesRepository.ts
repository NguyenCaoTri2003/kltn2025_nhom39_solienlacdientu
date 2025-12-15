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

  async getHomeroomClassesByLecturer(lecturerId: number, semesterId?: number) {
    let query = supabase
      .from('classes')
      .select('id, name, class_code, academic_year, class_type, semester_id')
      .eq('homeroom_teacher_id', lecturerId);

    if (semesterId) {
      query = query.eq('semester_id', semesterId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getClassById(classId: number) {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, homeroom_teacher_id")
      .eq("id", classId)
      .single();

    if (error) throw error;
    return data;
  }
}


