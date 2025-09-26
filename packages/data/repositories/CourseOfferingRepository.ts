import { supabase } from "../supabaseClient";

export class CourseOfferingRepository {
  async getOfferingsByCourse(courseId: number) {
    const { data, error } = await supabase
      .from("course_offerings")
      .select(
        "id, course_id, lecturer_id, name, class_code, capacity, registered, status, schedule, description"
      )
      .eq("course_id", courseId);

    if (error) throw error;
    return data ?? [];
  }
}


