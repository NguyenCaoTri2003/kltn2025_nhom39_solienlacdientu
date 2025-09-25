import { supabase } from "../supabaseClient";

export class CoursesRepository {
  async getCoursesByMajorId(majorId: number) {
    const { data, error } = await supabase
      .from("courses")
      .select(
        "id, name, course_code, tuition_fee, credit, description, has_practice, semester_id, major_id"
      )
      .eq("major_id", majorId);

    if (error) throw error;
    return data ?? [];
  }
}


