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

  async getOfferingById(offeringId: number) {
    const { data, error } = await supabase
      .from("course_offerings")
      .select(
        `
        id,
        name,
        class_code,
        capacity,
        registered,
        status,
        schedule,
        description,
        semester_id,
        semesters:semester_id (
          id,
          name,
          academic_year,
          start_date,
          end_date
        ),
        courses:course_id (
          id,
          course_code,
          credit
        ),
        weekly_schedules (
          id,
          day_of_week,
          start_period,
          period_count,
          classroom,
          building,
          type
        ),
        lecturers:lecturer_id (
          id,
          lecturer_code,
          users:users!lecturers_id_fkey (
            full_name, email
          )
        )
      `
      )
      .eq("id", offeringId)
      .single();

    if (error) throw error;
    return data;
  }

  async getPracticeGroups(offeringId: number) {
    const { data, error } = await supabase
      .from("practice_groups")
      .select(
        `
        id,
        group_number,
        capacity,
        registered,
        schedule,
        weekly_schedules (
          id,
          day_of_week,
          start_period,
          period_count,
          classroom,
          building,
          type
        ),
        lecturers:lecturer_id (
          id,
          lecturer_code,
          users:users!lecturers_id_fkey (
            full_name, email
          )
        )
      `
      )
      .eq("offering_id", offeringId);

    if (error) throw error;
    return data ?? [];
  }
}
