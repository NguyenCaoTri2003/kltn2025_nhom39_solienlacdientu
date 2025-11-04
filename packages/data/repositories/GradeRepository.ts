import { Grade, GradeGroup } from "@packages/core/entities/Grade";
import { supabase } from "../supabaseClient";

export class GradeRepository {
  // async getGradesByStudent(student_id: number) {
  //   const { data: theoryGrades, error: theoryError } = await supabase
  //     .from("grades")
  //     .select(`
  //     id,
  //     score_type,
  //     score,
  //     comment,
  //     enrollment:enrollment_id (
  //       id,
  //       student_id,
  //       course_offerings:offering_id (
  //         id,
  //         name,
  //         class_code,
  //         course:course_id (
  //           id,
  //           name,
  //           course_code,
  //           credit,
  //           semester_id
  //         ),
  //         lecturer_id
  //       )
  //     )
  //   `)
  //     .eq("enrollment.student_id", student_id);

  //   if (theoryError) throw theoryError;

  //   const { data: practiceGrades, error: practiceError } = await supabase
  //     .from("grades")
  //     .select(`
  //     id,
  //     score_type,
  //     score,
  //     comment,
  //     practice_enrollment:practice_enrollment_id (
  //       id,
  //       enrollment:enrollment_id (
  //         id,
  //         student_id,
  //         course_offerings:offering_id (
  //           id,
  //           name,
  //           class_code,
  //           course:course_id (
  //             id,
  //             name,
  //             course_code,
  //             credit,
  //             semester_id
  //           ),
  //           lecturer_id
  //         )
  //       ),
  //       practice_groups:group_id (
  //         id,
  //         group_number,
  //         lecturer_id
  //       )
  //     )
  //   `)
  //     .eq("practice_enrollment.enrollment.student_id", student_id);

  //   if (practiceError) throw practiceError;

  //   const grouped: Record<string, GradeGroup> = {};

  //   theoryGrades?.forEach((g: any) => {
  //     const offering = g.enrollment?.course_offerings;
  //     if (!offering) return;

  //     const offeringId = offering.id;
  //     if (!grouped[offeringId]) {
  //       grouped[offeringId] = {
  //         offering_id: offeringId,
  //         offering_name: offering.name,
  //         class_code: offering.class_code,
  //         course: offering.course,
  //         lecturer_id: offering.lecturer_id,
  //         theoryScores: [],
  //         practiceScores: [],
  //       };
  //     }
  //     grouped[offeringId].theoryScores.push(g);
  //   });

  //   practiceGrades?.forEach((g: any) => {
  //     const offering = g.practice_enrollment?.enrollment?.course_offerings;
  //     if (!offering) return;

  //     const offeringId = offering.id;
  //     if (!grouped[offeringId]) {
  //       grouped[offeringId] = {
  //         offering_id: offeringId,
  //         offering_name: offering.name,
  //         class_code: offering.class_code,
  //         course: offering.course,
  //         lecturer_id: offering.lecturer_id,
  //         theoryScores: [],
  //         practiceScores: [],
  //       };
  //     }
  //     grouped[offeringId].practiceScores.push({
  //       ...g,
  //       practice_group: g.practice_enrollment?.practice_groups,
  //     });
  //   });

  //   return Object.values(grouped);
  // }

  async getGradesByStudent(
    student_id: number,
    semesterId?: number
  ) {
    
    const { data: theoryGrades, error: theoryError } = await supabase
      .from("grades")
      .select(`
      id,
      score_type,
      score,
      comment,
      enrollment:enrollment_id (
        id,
        student_id,
        course_offerings:offering_id (
          id,
          name,
          class_code,
          lecturer_id,
          semesters:semester_id (
            id,
            name,
            academic_year,
            start_date,
            end_date
          )
        )
      )
    `)
      .eq("enrollment.student_id", student_id);

    if (theoryError) throw theoryError;

    const { data: practiceGrades, error: practiceError } = await supabase
      .from("grades")
      .select(`
      id,
      score_type,
      score,
      comment,
      practice_enrollment:practice_enrollment_id (
        id,
        enrollment:enrollment_id (
          id,
          student_id,
          course_offerings:offering_id (
            id,
            name,
            class_code,
            lecturer_id,
            semesters:semester_id (
              id,
              name,
              academic_year,
              start_date,
              end_date
            )
          )
        ),
        practice_groups:group_id (
          id,
          group_number
        )
      )
    `)
      .eq("practice_enrollment.enrollment.student_id", student_id);

    if (practiceError) throw practiceError;

    const filteredTheoryGrades = semesterId
      ? theoryGrades.filter(
        (g: any) =>
          g.enrollment?.course_offerings?.semesters?.id === semesterId
      )
      : theoryGrades;

    const filteredPracticeGrades = semesterId
      ? practiceGrades.filter(
        (g: any) =>
          g.practice_enrollment?.enrollment?.course_offerings?.semesters?.id === semesterId
      )
      : practiceGrades;

    const enrollmentIds = Array.from(
      new Set([
        ...filteredTheoryGrades.map((g: any) => g.enrollment?.id),
        ...filteredPracticeGrades.map((g: any) => g.practice_enrollment?.enrollment?.id),
      ].filter(Boolean))
    );

    let gradeSummaries: Record<number, any> = {};
    if (enrollmentIds.length > 0) {
      const { data: summaries, error: summaryError } = await supabase
        .from("grade_summary")
        .select("*")
        .in("enrollment_id", enrollmentIds);

      if (summaryError) throw summaryError;

      gradeSummaries = summaries.reduce((acc: any, s: any) => {
        acc[s.enrollment_id] = s;
        return acc;
      }, {});
    }

    const grouped: Record<string, GradeGroup> = {};

    filteredTheoryGrades.forEach((g: any) => {
      const enrollment = g.enrollment;
      const offering = enrollment?.course_offerings;
      if (!offering) return;

      const offeringId = offering.id;
      if (!grouped[offeringId]) {
        grouped[offeringId] = {
          offering_id: offeringId,
          offering_name: offering.name,
          class_code: offering.class_code,
          course: offering.course,
          lecturer_id: offering.lecturer_id,
          theoryScores: [],
          practiceScores: [],
          summary: enrollment ? gradeSummaries[enrollment.id] || null : null,
        };
      }
      grouped[offeringId].theoryScores.push(g);
    });

    filteredPracticeGrades.forEach((g: any) => {
      const enrollment = g.practice_enrollment?.enrollment;
      const offering = enrollment?.course_offerings;
      if (!offering) return;

      const offeringId = offering.id;
      if (!grouped[offeringId]) {
        grouped[offeringId] = {
          offering_id: offeringId,
          offering_name: offering.name,
          class_code: offering.class_code,
          course: offering.course,
          lecturer_id: offering.lecturer_id,
          theoryScores: [],
          practiceScores: [],
          summary: enrollment ? gradeSummaries[enrollment.id] || null : null,
        };
      }
      grouped[offeringId].practiceScores.push({
        ...g,
        practice_group: g.practice_enrollment?.practice_groups,
      });
    });

    return Object.values(grouped);
  }

  async getGradesByOffering(student_id: number, offering_id: number) {
    const { data: theoryData, error: theoryError } = await supabase
      .from("grades")
      .select(`
      id,
      score_type,
      score,
      comment,
      enrollment:enrollment_id (
        id,
        student_id,
        offering_id
      )
    `)
      .eq("enrollment.student_id", student_id)
      .eq("enrollment.offering_id", offering_id)
      .not("enrollment", "is", null);

    if (theoryError) throw theoryError;

    const { data: practiceData, error: practiceError } = await supabase
      .from("grades")
      .select(`
      id,
      score_type,
      score,
      comment,
      practice_enrollment:practice_enrollment_id (
        id,
        enrollment:enrollment_id (
          id,
          student_id,
          offering_id
        ),
        practice_groups:group_id (
          id,
          group_number,
          lecturer_id
        )
      )
    `)
      .eq("practice_enrollment.enrollment.student_id", student_id)
      .eq("practice_enrollment.enrollment.offering_id", offering_id)
      .not("practice_enrollment", "is", null); // tránh record null

    if (practiceError) throw practiceError;

    return {
      theoryScores: theoryData ?? [],
      practiceScores: practiceData ?? [],
    };
  }

  async getAllGradesByOffering(offeringId: number) {
    // --- Lấy điểm lý thuyết ---
    const { data: theoryGrades, error: theoryError } = await supabase
      .from("grades")
      .select(`
      id,
      score_type,
      score,
      comment,
      enrollment:enrollment_id (
        id,
        student_id,
        students:student_id (
          id,
          student_code,
          users(full_name)
        ),
        course_offerings:offering_id (
          id,
          name,
          class_code,
          course:course_id (
            id,
            name,
            course_code,
            credit,
            semester_id
          ),
          lecturer_id
        )
      )
    `)
      .eq("enrollment.offering_id", offeringId);

    if (theoryError) throw theoryError;

    // --- Lấy điểm thực hành ---
    const { data: practiceGrades, error: practiceError } = await supabase
      .from("grades")
      .select(`
      id,
      score_type,
      score,
      comment,
      practice_enrollment:practice_enrollment_id (
        id,
        enrollment:enrollment_id (
          id,
          student_id,
          students:student_id (
            id,
            student_code,
            users(full_name)
          ),
          course_offerings:offering_id (
            id,
            name,
            class_code,
            course:course_id (
              id,
              name,
              course_code,
              credit,
              semester_id
            ),
            lecturer_id
          )
        ),
        practice_groups:group_id (
          id,
          group_number,
          lecturer_id
        )
      )
    `)
      .eq("practice_enrollment.enrollment.offering_id", offeringId);

    if (practiceError) throw practiceError;

    const extractEnrollmentId = (enrollment: any) =>
      Array.isArray(enrollment) ? enrollment[0]?.id : enrollment?.id;

    const enrollmentIds = [
      ...(theoryGrades?.map((g: any) => extractEnrollmentId(g.enrollment)) ?? []),
      ...(practiceGrades?.map((g: any) => extractEnrollmentId(g.practice_enrollment?.enrollment)) ?? []),
    ].filter((id): id is number => !!id);

    const uniqueEnrollmentIds = [...new Set(enrollmentIds)];

    const { data: summaries, error: summaryError } = await supabase
      .from("grade_summary")
      .select("enrollment_id, total_score, gpa4, letter_grade, classification, passed, note")
      .in("enrollment_id", uniqueEnrollmentIds);

    if (summaryError) throw summaryError;

    const grouped: Record<string, any> = {};

    theoryGrades?.forEach((g: any) => {
      const student = g.enrollment?.students;
      if (!student) return;

      const studentId = student.id;
      const enrollmentId = g.enrollment?.id;

      if (!grouped[studentId]) {
        grouped[studentId] = {
          student_id: studentId,
          student_code: student.student_code,
          student_name: student.users.full_name,
          offering: g.enrollment.course_offerings,
          theoryScores: [],
          practiceScores: [],
          practice_group_number: null,
          summary: summaries?.find((s) => s.enrollment_id === enrollmentId) ?? null,
        };
      }

      grouped[studentId].theoryScores.push({
        id: g.id,
        type: g.score_type,
        score: g.score,
        comment: g.comment,
      });
    });

    practiceGrades?.forEach((g: any) => {
      const student = g.practice_enrollment?.enrollment?.students;
      if (!student) return;

      const studentId = student.id;
      const enrollmentId = g.practice_enrollment?.enrollment?.id;
      const group = g.practice_enrollment?.practice_groups;

      if (!grouped[studentId]) {
        grouped[studentId] = {
          student_id: studentId,
          student_code: student.student_code,
          student_name: student.users.full_name,
          offering: g.practice_enrollment.enrollment.course_offerings,
          theoryScores: [],
          practiceScores: [],
          practice_group_number: group?.group_number ?? null,
          summary: summaries?.find((s) => s.enrollment_id === enrollmentId) ?? null,
        };
      } else if (!grouped[studentId].practice_group_number) {
        grouped[studentId].practice_group_number = group?.group_number ?? null;
      }

      grouped[studentId].practiceScores.push({
        id: g.id,
        type: g.score_type,
        score: g.score,
        comment: g.comment,
        practice_group: group,
      });
    });

    return Object.values(grouped);
  }

  async getStudentGradesInOffering(studentId: number, offeringId: number) {
    const { data: enrollment, error: enrollError } = await supabase
      .from("enrollment")
      .select("id")
      .eq("student_id", studentId)
      .eq("offering_id", offeringId)
      .single();

    if (enrollError || !enrollment)
      throw new Error("Không tìm thấy enrollment");

    const { data: theoryGrades, error: theoryError } = await supabase
      .from("grades")
      .select("id, score_type, score, comment")
      .eq("enrollment_id", enrollment.id)
      .is("practice_enrollment_id", null);

    if (theoryError) throw theoryError;

    const { data: practiceEnrollments, error: peError } = await supabase
      .from("practice_enrollment")
      .select(`
      id,
      group_id,
      practice_groups (
        id,
        group_number,
        lecturer_id
      )
    `)
      .eq("enrollment_id", enrollment.id);

    if (peError) throw peError;

    const practiceEnrollmentIds = practiceEnrollments?.map((p) => p.id) ?? [];

    let practiceGrades: any[] = [];
    if (practiceEnrollmentIds.length > 0) {
      const { data, error } = await supabase
        .from("grades")
        .select(`
        id,
        score_type,
        score,
        comment,
        practice_enrollment_id,
        practice_enrollment:practice_enrollment_id (
          id,
          group_id,
          practice_groups (
            id,
            group_number,
            lecturer_id
          )
        )
      `)
        .in("practice_enrollment_id", practiceEnrollmentIds);

      if (error) throw error;

      practiceGrades = data.map((g) => ({
        id: g.id,
        type: g.score_type,
        score: g.score,
        comment: g.comment
      }));
    }

    const { data: summary, error: summaryError } = await supabase
      .from("grade_summary")
      .select("total_score, gpa4, letter_grade, classification, passed, note")
      .eq("enrollment_id", enrollment.id)
      .single();

    if (summaryError && summaryError.code !== "PGRST116") throw summaryError;

    const practice_group =
      practiceEnrollments?.[0]?.practice_groups ?? null;

    return {
      student_id: studentId,
      theoryScores:
        theoryGrades?.map((g) => ({
          id: g.id,
          type: g.score_type,
          score: g.score,
          comment: g.comment,
        })) ?? [],
      practiceScores: practiceGrades ?? [],
      practice_group: practice_group,
      summary: summary ?? null,
    };
  }

}
