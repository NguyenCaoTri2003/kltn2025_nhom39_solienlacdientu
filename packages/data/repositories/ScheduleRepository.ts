import { supabase } from "../supabaseClient";

export class ScheduleRepository {
  async getStudentSchedules(studentId: number) {
    const { data: enrollments } = await supabase
      .from("enrollment")
      .select("id, offering_id")
      .eq("student_id", studentId);

    if (!enrollments) return [];

    const offeringIds = enrollments.map((e) => e.offering_id);

    const { data: practiceEnrollments } = await supabase
      .from("practice_enrollment")
      .select("group_id")
      .in("enrollment_id", enrollments.map(e => e.id));

    const registeredGroupIds = practiceEnrollments?.map(pe => pe.group_id) ?? [];

    let weeklyQuery = supabase
      .from("weekly_schedules")
      .select(`
    *,
    course_offering:offering_id (
      id,
      name,
      class_code
    )
  `)
      .in("offering_id", offeringIds);

    if (registeredGroupIds.length > 0) {
      weeklyQuery = weeklyQuery.or(
        `practice_group_id.is.null,practice_group_id.in.(${registeredGroupIds.join(",")})`
      );
    } else {
      weeklyQuery = weeklyQuery.is("practice_group_id", null);
    }

    const { data: weeklySchedules, error: weeklyError } = await weeklyQuery;
    if (weeklyError) throw weeklyError;

    const { data: actualSchedules } = await supabase
      .from("actual_schedules")
      .select(`
        id,
        offering_id,
        practice_group_id,
        schedule_date,
        start_period,
        period_count,
        classroom,
        building,
        type,
        note,
        course_offering:offering_id (
          id,
          name,
          class_code
        )
      `)
      .in("offering_id", offeringIds)
      .or(`practice_group_id.is.null,practice_group_id.in.(${registeredGroupIds.join(",")})`);

    return { weeklySchedules, actualSchedules };
  }

  async getStudentOfferingSchedule(studentId: number, offeringId: number) {
    const { data: enrollment } = await supabase
      .from("enrollment")
      .select("id")
      .eq("student_id", studentId)
      .eq("offering_id", offeringId)
      .maybeSingle();

    if (!enrollment) return { weekly: [], actual: [] };

    const { data: practiceEnrollments } = await supabase
      .from("practice_enrollment")
      .select("group_id")
      .eq("enrollment_id", enrollment.id);

    const registeredGroupIds = practiceEnrollments?.map(pe => pe.group_id) ?? [];

    const { data: weekly } = await supabase
      .from("weekly_schedules")
      .select(`
        *,
        course_offering:offering_id (
          id,
          name,
          class_code
        )
      `)
      .eq("offering_id", offeringId)
      .or(`practice_group_id.is.null,practice_group_id.in.(${registeredGroupIds.join(",")})`);

    const { data: actual } = await supabase
      .from("actual_schedules")
      .select(`
        *,
        course_offering:offering_id (
          id,
          name,
          class_code
        )
      `)
      .eq("offering_id", offeringId)
      .or(`practice_group_id.is.null,practice_group_id.in.(${registeredGroupIds.join(",")})`);

    return { weekly, actual };
  }

  async getStudentSchedulesByDate(
    studentId: number,
    startDate?: string,
    endDate?: string
  ) {
    const { data: enrollments } = await supabase
      .from("enrollment")
      .select("id, offering_id")
      .eq("student_id", studentId);

    if (!enrollments || enrollments.length === 0) return [];

    const offeringIds = enrollments.map(e => e.offering_id);

    const { data: practiceEnrollments } = await supabase
      .from("practice_enrollment")
      .select("group_id")
      .in("enrollment_id", enrollments.map(e => e.id));

    const registeredGroupIds = practiceEnrollments?.map(pe => pe.group_id) ?? [];

    let query = supabase
      .from("actual_schedules")
      .select(`
      *,
      course_offering:offering_id (
        id,
        name,
        class_code
      )
    `)
      .in("offering_id", offeringIds);

    if (registeredGroupIds.length > 0) {
      query = query.or(`practice_group_id.is.null,practice_group_id.in.(${registeredGroupIds.join(",")})`);
    } else {
      query = query.is("practice_group_id", null);
    }

    if (startDate) query = query.gte("schedule_date", startDate);
    if (endDate) query = query.lte("schedule_date", endDate);

    const { data: schedules, error } = await query;
    if (error) throw error;

    return schedules;
  }

  async getStudentSchedulesOfferingByDate(
    studentId: number,
    offeringId: number,
    startDate?: string,
    endDate?: string
  ) {
    const { data: enrollment } = await supabase
      .from("enrollment")
      .select("id")
      .eq("student_id", studentId)
      .eq("offering_id", offeringId)
      .maybeSingle();

    if (!enrollment) return { weekly: [], actual: [] };

    const { data: practiceEnrollments } = await supabase
      .from("practice_enrollment")
      .select("group_id")
      .eq("enrollment_id", enrollment.id);

    const registeredGroupIds = practiceEnrollments?.map(pe => pe.group_id) ?? [];

    let weeklyQuery = supabase
      .from("weekly_schedules")
      .select(`
      *,
      course_offering:offering_id (
        id,
        name,
        class_code
      )
    `)
      .eq("offering_id", offeringId);

    if (registeredGroupIds.length > 0) {
      weeklyQuery = weeklyQuery.or(`practice_group_id.is.null,practice_group_id.in.(${registeredGroupIds.join(",")})`);
    } else {
      weeklyQuery = weeklyQuery.is("practice_group_id", null);
    }

    const { data: weekly, error: weeklyError } = await weeklyQuery;
    if (weeklyError) throw weeklyError;

    let actualQuery = supabase
      .from("actual_schedules")
      .select(`
      *,
      course_offering:offering_id (
        id,
        name,
        class_code
      )
    `)
      .eq("offering_id", offeringId);

    if (registeredGroupIds.length > 0) {
      actualQuery = actualQuery.or(`practice_group_id.is.null,practice_group_id.in.(${registeredGroupIds.join(",")})`);
    } else {
      actualQuery = actualQuery.is("practice_group_id", null);
    }

    if (startDate) actualQuery = actualQuery.gte("schedule_date", startDate);
    if (endDate) actualQuery = actualQuery.lte("schedule_date", endDate);

    const { data: actual, error: actualError } = await actualQuery;
    if (actualError) throw actualError;

    return { weekly, actual };
  }
}
