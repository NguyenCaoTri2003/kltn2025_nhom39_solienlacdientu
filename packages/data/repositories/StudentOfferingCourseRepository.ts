import { supabase } from "../supabaseClient";

export class StudentCourseRepository {

  async getStudentOfferingsLite(studentId: number, semesterId?: number) {
    let query = supabase
      .from("enrollment")
      .select(`
      id,
      student_id,
      registered_at,
      course_offerings:offering_id (
        id,
        name,
        class_code,
        status,
        semester_id,
        semesters:semester_id (
          id,
          name,
          academic_year
        )
      ),
      practice_enrollment (
        id,
        group_id
      )
    `)
      .eq("student_id", studentId)
      .order("registered_at", { ascending: false });

    if (semesterId) {
      query = query.filter("course_offerings.semester_id", "eq", semesterId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data ?? [];
  }

  async getOfferingDetail(studentId: number, offeringId: number) {
    const { data, error } = await supabase
      .from("enrollment")
      .select(`
          id,
          student_id,
          registered_at,
          course_offerings (
          id,
          name,
          class_code,
          capacity,
          registered,
          status,
          description,
          semester_id,
          lecturers:lecturer_id (
            id,
            lecturer_code,
            users:users!lecturers_id_fkey (
              id,
              full_name,
              email
            )
          ),
           courses:course_id (        
            id,
            course_code,
            name,
            credit,
            tuition_fee,
            has_practice
          ),
          semesters:semester_id (
            id,
            name,
            academic_year,
            start_date,
            end_date
          ),
          weekly_schedules (
            id,
            day_of_week,
            start_period,
            period_count,
            classroom,
            building,
            type
          )
        ),
        practice_enrollment (
          id,
          practice_groups:group_id (
            id,
            group_number,
            capacity,
            registered,
            lecturers:lecturer_id (
              id,
              lecturer_code,
              users:users!lecturers_id_fkey (
                id,
                full_name,
                email
              )
            ),
            weekly_schedules (
              id,
              day_of_week,
              start_period,
              period_count,
              classroom,
              building,
              type
            )
          )
        )
      `)
      .eq("student_id", studentId)
      .eq("offering_id", offeringId) 
      .order("registered_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    return data?.[0] ?? null;
  }
}
