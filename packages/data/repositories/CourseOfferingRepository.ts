import { supabase } from "../supabaseClient";

export class CourseOfferingRepository {
  async getOfferingsByCourse(courseId: number) {
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
        semester_id,
        weekly_schedules (
          id,
          day_of_week,
          start_period,
          period_count,
          classroom,
          building,
          type
        )
      `)
      .eq("course_id", courseId)
      .order("day_of_week", { foreignTable: "weekly_schedules" });

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
        semester_id,
        weekly_schedules (
          id,
          day_of_week,
          start_period,
          period_count,
          classroom,
          building,
          type
        ),
        courses (*)
      `)
      .eq("lecturer_id", lecturerId)
      .order("day_of_week", { foreignTable: "weekly_schedules" });

    if (error) throw error;
    return data ?? [];
  }
}
