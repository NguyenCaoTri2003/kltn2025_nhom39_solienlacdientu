import { supabase } from "../supabaseClient";

export class ScheduleRepository {

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

  async getLecturerSchedulesByDate(
    lecturerId: number,
    startDate?: string,
    endDate?: string
  ) {
    // Lấy các học phần mà giảng viên dạy LT
    const { data: theoryOfferings } = await supabase
      .from("course_offerings")
      .select("id")
      .eq("lecturer_id", lecturerId);

    const theoryOfferingIds = theoryOfferings?.map(o => o.id) ?? [];

    // Lấy các nhóm thực hành mà giảng viên phụ trách
    const { data: practiceGroups } = await supabase
      .from("practice_groups")
      .select("id, offering_id")
      .eq("lecturer_id", lecturerId);

    const practiceOfferingIds = practiceGroups?.map(pg => pg.offering_id) ?? [];
    const practiceGroupIds = practiceGroups?.map(pg => pg.id) ?? [];

    const allOfferingIds = Array.from(new Set([...theoryOfferingIds, ...practiceOfferingIds]));

    if (allOfferingIds.length === 0) return [];

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
      .in("offering_id", allOfferingIds);

    if (practiceGroupIds.length > 0 && theoryOfferingIds.length > 0) {
      query = query.or(
        `practice_group_id.is.null,practice_group_id.in.(${practiceGroupIds.join(",")})`
      );
    } else if (practiceGroupIds.length > 0) {
      query = query.in("practice_group_id", practiceGroupIds);
    } else {
      query = query.is("practice_group_id", null); // chỉ LT
    }

    if (startDate) query = query.gte("schedule_date", startDate);
    if (endDate) query = query.lte("schedule_date", endDate);

    const { data: schedules, error } = await query;
    if (error) throw error;

    return schedules;
  }

  async getLecturerSchedulesOfferingByDate(
    lecturerId: number,
    offeringId: number,
    startDate?: string,
    endDate?: string
  ) {
    // Check nếu giảng viên dạy LT
    const { data: offering } = await supabase
      .from("course_offerings")
      .select("id")
      .eq("id", offeringId)
      .eq("lecturer_id", lecturerId)
      .maybeSingle();

    // Check các nhóm thực hành mà giảng viên phụ trách
    const { data: practiceGroups } = await supabase
      .from("practice_groups")
      .select("id")
      .eq("offering_id", offeringId)
      .eq("lecturer_id", lecturerId);

    if (!offering && (!practiceGroups || practiceGroups.length === 0)) {
      return { weekly: [], actual: [] };
    }

    const practiceGroupIds = practiceGroups?.map(pg => pg.id) ?? [];

    // Weekly schedules
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

    if (practiceGroupIds.length > 0 && offering) {
      weeklyQuery = weeklyQuery.or(
        `practice_group_id.is.null,practice_group_id.in.(${practiceGroupIds.join(",")})`
      );
    } else if (practiceGroupIds.length > 0) {
      weeklyQuery = weeklyQuery.in("practice_group_id", practiceGroupIds);
    } else {
      weeklyQuery = weeklyQuery.is("practice_group_id", null);
    }

    const { data: weekly, error: weeklyError } = await weeklyQuery;
    if (weeklyError) throw weeklyError;

    // Actual schedules
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

    if (practiceGroupIds.length > 0 && offering) {
      actualQuery = actualQuery.or(
        `practice_group_id.is.null,practice_group_id.in.(${practiceGroupIds.join(",")})`
      );
    } else if (practiceGroupIds.length > 0) {
      actualQuery = actualQuery.in("practice_group_id", practiceGroupIds);
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
