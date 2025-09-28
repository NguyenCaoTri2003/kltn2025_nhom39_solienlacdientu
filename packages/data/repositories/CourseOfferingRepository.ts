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

  async getOfferingsByLecturer(lecturerId: number) {
    const { data, error } = await supabase
      .from("course_offerings")
      .select(`
        id, 
        course_id, 
        lecturer_id, 
        name, 
        class_code, 
        capacity, 
        registered, 
        status, 
        schedule, 
        description,
        courses:course_id (
          id,
          name,
          course_code,
          credit,
          semester_id
        )
      `)
      .eq("lecturer_id", lecturerId);

    if (error) throw error;
    return data ?? [];
  }
}


