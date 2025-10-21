// import { supabase } from "../supabaseClient";

// export class StudentCourseRepository {
//   /**
//    * Lấy danh sách học phần lý thuyết mà sinh viên đã đăng ký
//    */
//   async getTheoryCourses(studentId: number, semesterId?: number) {
//     let query = supabase
//       .from("enrollment")
//       .select(`
//         id,
//         student_id,
//         registered_at,
//         course_offerings (
//           id,
//           course_id,
//           name,
//           class_code,
//           capacity,
//           registered,
//           status,
//           schedule,
//           description,
//           semester_id,
//           lecturers:lecturer_id (
//             id,
//             lecturer_code,
//             users:users!lecturers_id_fkey (
//               id,
//               full_name,
//               email
//             )
//           ),
//           semesters:semester_id (
//             id,
//             name,
//             academic_year,
//             start_date,
//             end_date
//           ),
//           weekly_schedules (
//             id,
//             day_of_week,
//             start_period,
//             period_count,
//             classroom,
//             building,
//             type
//           )
//         )
//       `)
//       .eq("student_id", studentId)
//       .order("registered_at", { ascending: false });

//     if (semesterId) {
//       query = query.eq("course_offerings.semester_id", semesterId);
//     }

//     const { data, error } = await query;
//     if (error) throw error;

//     return (data ?? []).map((enroll: any) => ({
//       enrollment_id: enroll.id,
//       registered_at: enroll.registered_at,
//       student_id: enroll.student_id,
//       course_offering: enroll.course_offerings,
//     }));
//   }

//   /**
//    * Lấy danh sách nhóm thực hành của các enrollment_id
//    */
//   async getPracticeGroupsByEnrollments(enrollmentIds: number[]) {
//     if (!enrollmentIds.length) return [];

//     const { data, error } = await supabase
//       .from("practice_enrollment")
//       .select(`
//         id,
//         enrollment_id,
//         assigned_at,
//         practice_groups:group_id (
//           id,
//           group_number,
//           capacity,
//           registered,
//           schedule,
//           lecturers:lecturer_id (
//             id,
//             lecturer_code,
//             users:users!lecturers_id_fkey (
//               id,
//               full_name,
//               email
//             )
//           ),
//           weekly_schedules (
//             id,
//             day_of_week,
//             start_period,
//             period_count,
//             classroom,
//             building,
//             type
//           )
//         )
//       `)
//       .in("enrollment_id", enrollmentIds);

//     if (error) throw error;
//     return data ?? [];
//   }
// }

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
