import { supabase } from "../supabaseClient";
import dayjs from "dayjs";

type LecturerUser = {
  full_name: string | null;
  email: string | null;
};

type Lecturer = {
  id: number;
  lecturer_code: string;
  users: LecturerUser | null;
};

type PracticeGroup = {
  id: number;
  group_number: number;
  lecturers?: Lecturer | Lecturer[] | null;
};

type CourseOffering = {
  id: number;
  name: string;
  class_code: string;
  lecturers?: Lecturer | Lecturer[] | null;
  class?: {
    id: number;
    name: string;
    class_code: string;
  } | null;
};

type ActualSchedule = {
  id: number;
  schedule_date: string;
  start_period: number;
  period_count: number;
  classroom: string | null;
  building: string | null;
  type: "theory" | "practice" | "exam";
  status: string;
  note: string | null;
  course_offering: CourseOffering | null;
  practice_group: PracticeGroup | null;
  exam_group_number?: string | null;
  exam_range_from?: string | null;
  exam_range_to?: string | null;
  exam_lecturer_ids?: number[] | null;
  exam_lecturers?: Lecturer[];
};

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

    const offeringIds = enrollments.map((e) => e.offering_id);

    const { data: practiceEnrollments } = await supabase
      .from("practice_enrollment")
      .select("group_id")
      .in(
        "enrollment_id",
        enrollments.map((e) => e.id)
      );

    const registeredGroupIds =
      practiceEnrollments?.map((pe) => pe.group_id) ?? [];

    let query = supabase
      .from("actual_schedules")
      .select(
        `
      id,
      offering_id,
      practice_group_id,
      schedule_date,
      start_period,
      period_count,
      classroom,
      building,
      type,
      status,
      note,
      exam_group_number,
      exam_range_from,
      exam_range_to,
      exam_lecturer_ids,
      course_offering:offering_id (
        id,
        name,
        class_code,
        class_id,
        lecturers:lecturer_id (
          id,
          lecturer_code,
          users:users!lecturers_id_fkey (
            full_name,
            email
          )
        ),
        class:class_id ( 
          id,
          name,
          class_code
        )
      ),
      practice_group:practice_group_id (
        id,
        group_number,
        lecturers:lecturer_id (
          id,
          lecturer_code,
          users:users!lecturers_id_fkey (
            full_name,
            email
          )
        )
      )
    `
      )
      .in("offering_id", offeringIds);

    if (registeredGroupIds.length > 0) {
      query = query.or(
        `practice_group_id.is.null,practice_group_id.in.(${registeredGroupIds.join(",")})`
      );
    } else {
      query = query.is("practice_group_id", null);
    }

    if (startDate) query = query.gte("schedule_date", startDate);
    if (endDate) query = query.lte("schedule_date", endDate);

    const { data: schedules, error } = await query.returns<ActualSchedule[]>();
    if (error) throw error;

    for (const s of schedules ?? []) {
      if (s.type === "exam" && Array.isArray(s.exam_lecturer_ids)) {
        if (s.exam_lecturer_ids.length > 0) {
          const { data: examLecturers } = await supabase
            .from("lecturers")
            .select(
              `
            id,
            lecturer_code,
            users:users!lecturers_id_fkey (
              full_name,
              email
            )
          `
            )
            .in("id", s.exam_lecturer_ids);

          s.exam_lecturers = (examLecturers ?? []).map((lec: any) => ({
            id: lec.id,
            lecturer_code: lec.lecturer_code,
            users: Array.isArray(lec.users) ? (lec.users[0] ?? null) : (lec.users ?? null),
          }));
        } else {
          s.exam_lecturers = [];
        }
      }
    }

    return (
      schedules?.map((s) => {
        const courseLecturer =
          Array.isArray(s.course_offering?.lecturers)
            ? s.course_offering?.lecturers[0]
            : s.course_offering?.lecturers;

        const practiceLecturer =
          Array.isArray(s.practice_group?.lecturers)
            ? s.practice_group?.lecturers[0]
            : s.practice_group?.lecturers;

        const isExam = s.type === "exam";

        return {
          id: s.id,
          schedule_date: s.schedule_date,
          start_period: s.start_period,
          period_count: s.period_count,
          classroom: s.classroom,
          building: s.building,
          type: s.type,
          status: s.status,
          note: s.note,
          course_offering: {
            id: s.course_offering?.id,
            name: s.course_offering?.name,
            class_code: s.course_offering?.class_code,
            class_name: s.course_offering?.class?.name ?? null,
          },
          lecturer:
            s.type === "theory"
              ? {
                full_name: courseLecturer?.users?.full_name ?? null,
                email: courseLecturer?.users?.email ?? null,
              }
              : s.practice_group
                ? {
                  full_name: practiceLecturer?.users?.full_name ?? null,
                  email: practiceLecturer?.users?.email ?? null,
                }
                : null,
          practice_group:
            s.type === "practice" && s.practice_group
              ? {
                id: s.practice_group.id,
                group_number: s.practice_group.group_number,
              }
              : null,
          exam_info: isExam
            ? {
              exam_group_number: s.exam_group_number,
              exam_range_from: s.exam_range_from,
              exam_range_to: s.exam_range_to,
              lecturers:
                s.exam_lecturers?.map((lec) => ({
                  id: lec.id,
                  full_name: lec.users?.full_name,
                  email: lec.users?.email,
                })) ?? [],
            }
            : null,
        };
      }) ?? []
    );
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
        class_code,
        class_id,
        class:class_id (
          id,
          name,
          class_code
        )
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
      query = query.is("practice_group_id", null);
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
    const { data: offering } = await supabase
      .from("course_offerings")
      .select("id")
      .eq("id", offeringId)
      .eq("lecturer_id", lecturerId)
      .maybeSingle();

    const { data: practiceGroups } = await supabase
      .from("practice_groups")
      .select("id")
      .eq("offering_id", offeringId)
      .eq("lecturer_id", lecturerId);

    if (!offering && (!practiceGroups || practiceGroups.length === 0)) {
      return { weekly: [], actual: [] };
    }

    const practiceGroupIds = practiceGroups?.map(pg => pg.id) ?? [];

    let weeklyQuery = supabase
      .from("weekly_schedules")
      .select(`
      *,
      course_offering:offering_id (
        id,
        name,
        class_code,
        class_id,
        class:class_id (
          id,
          name,
          class_code
        )
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
        class_code,
        class_id,
        class:class_id (
          id,
          name,
          class_code
        )
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

  async getStudentSchedulesToday(studentId: number) {
    const todayStart = dayjs().startOf("day").toISOString();
    const todayEnd = dayjs().endOf("day").toISOString();

    const { data: enrollments } = await supabase
      .from("enrollment")
      .select("offering_id")
      .eq("student_id", studentId);

    const offeringIds = enrollments?.map((e: any) => e.offering_id) ?? [];

    const { data, error } = await supabase
      .from("actual_schedules")
      .select(
        `
        id,
        offering_id,
        practice_group_id,
        schedule_date,
        start_period,
        period_count,
        classroom,
        building,
        type,
        status,
        note,
        weekly_schedule_id,
        course_offering:offering_id (
          id,
          name,
          class_code,
          class_id,
          lecturers:lecturer_id (
            id,
            lecturer_code,
            users:users!lecturers_id_fkey (
              full_name,
              email
            )
          ),
          class:class_id ( 
            id,
            name,
            class_code
          )
        )
      `
      )
      .eq("status", "scheduled")
      .in("offering_id", offeringIds)
      .gte("schedule_date", todayStart)
      .lte("schedule_date", todayEnd)
      .order("schedule_date", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getLecturerSchedulesToday(lecturerId: number) {
    const todayStart = dayjs().startOf("day").toISOString();
    const todayEnd = dayjs().endOf("day").toISOString();

    const { data: theory, error: theoryErr } = await supabase
      .from("actual_schedules")
      .select(
        `
        *,
        course_offerings (
          id,
          course_id,
          name,
          class_code,
          lecturer_id,
          courses (id, name, course_code)
        )
      `
      )
      .eq("status", "scheduled")
      .gte("schedule_date", todayStart)
      .lte("schedule_date", todayEnd)
      .eq("course_offerings.lecturer_id", lecturerId)
      .order("schedule_date", { ascending: true });
    if (theoryErr) throw theoryErr;

    const { data: practice, error: practiceErr } = await supabase
      .from("actual_schedules")
      .select(
        `
        *,
        practice_groups (
          id,
          group_number,
          lecturer_id
        ),
        course_offerings (
          id,
          course_id,
          name,
          class_code
        )
      `
      )
      .eq("status", "scheduled")
      .gte("schedule_date", todayStart)
      .lte("schedule_date", todayEnd)
      .eq("practice_groups.lecturer_id", lecturerId)
      .order("schedule_date", { ascending: true });
    if (practiceErr) throw practiceErr;

    const { data: exam, error: examErr } = await supabase
      .from("actual_schedules")
      .select(
        `
        *,
        course_offerings (
          id,
          course_id,
          name,
          class_code
        )
      `
      )
      .eq("status", "scheduled")
      .gte("schedule_date", todayStart)
      .lte("schedule_date", todayEnd)
      .contains("exam_lecturer_ids", [lecturerId])
      .order("schedule_date", { ascending: true });
    if (examErr) throw examErr;

    const allSchedules = [...theory, ...practice, ...exam];

    const uniqueSchedulesMap = new Map<number, any>();
    allSchedules.forEach((s) => {
      if (!uniqueSchedulesMap.has(s.id)) {
        uniqueSchedulesMap.set(s.id, s);
      } else {
        const existing = uniqueSchedulesMap.get(s.id);
        uniqueSchedulesMap.set(s.id, { ...existing, ...s });
      }
    });

    const uniqueSchedules = Array.from(uniqueSchedulesMap.values());

    uniqueSchedules.sort(
      (a, b) => new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime()
    );

    return uniqueSchedules;
  }

  async getOfferingScheduleToAttendance(
    offeringId: number,
    lecturerId: number
  ) {
    const { data: offering, error: offeringError } = await supabase
      .from("course_offerings")
      .select("id, lecturer_id")
      .eq("id", offeringId)
      .single();

    if (offeringError || !offering) {
      throw new Error("Không tìm thấy học phần");
    }

    const isTheoryLecturer = offering.lecturer_id === lecturerId;

    let theory: any[] = [];

    if (isTheoryLecturer) {
      const { data, error } = await supabase
        .from("actual_schedules")
        .select(`
        id,
        offering_id,
        practice_group_id,
        schedule_date,
        type,
        status
      `)
        .eq("offering_id", offeringId)
        .eq("type", "theory")
        .order("schedule_date");

      if (error) {
        throw new Error("Không thể lấy lịch lý thuyết");
      }

      theory = data ?? [];
    }

    let practice: any[] = [];

    if (isTheoryLecturer) {
      const { data, error } = await supabase
        .from("actual_schedules")
        .select(`
        id,
        offering_id,
        practice_group_id,
        schedule_date,
        type,
        status
      `)
        .eq("offering_id", offeringId)
        .eq("type", "practice")
        .order("schedule_date");

      if (error) {
        throw new Error("Không thể lấy lịch thực hành");
      }

      practice = data ?? [];
    } else {
      const { data, error } = await supabase
        .from("actual_schedules")
        .select(`
        id,
        offering_id,
        practice_group_id,
        schedule_date,
        type,
        status,
        practice_groups!inner (
          id,
          lecturer_id
        )
      `)
        .eq("offering_id", offeringId)
        .eq("type", "practice")
        .eq("practice_groups.lecturer_id", lecturerId)
        .order("schedule_date");

      if (error) {
        throw new Error("Không thể lấy lịch thực hành");
      }

      practice = data ?? [];
    }

    return [...theory, ...practice].sort(
      (a, b) =>
        new Date(a.schedule_date).getTime() -
        new Date(b.schedule_date).getTime()
    );
  }

}
