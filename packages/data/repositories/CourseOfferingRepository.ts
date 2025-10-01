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
        ),
      `)
      .eq("course_id", courseId)
      
      .order("day_of_week", { foreignTable: "weekly_schedules" });

    if (error) throw error;
    return data ?? [];
  }

  async getOfferingsByLecturer(lecturerId: number, semesterId?: number) {
    let query = supabase
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
        courses (*),
        practice_groups (id)
      `)
      .eq("lecturer_id", lecturerId)
      .order("day_of_week", { foreignTable: "weekly_schedules" });

    if (semesterId) {
      query = query.eq("semester_id", semesterId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(offering => ({
      ...offering,
      practice_group_count: offering.practice_groups?.length ?? 0
    }));
  }
}
