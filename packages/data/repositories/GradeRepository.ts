import { Grade, GradeGroup } from "@packages/core/entities/Grade";
import { supabase } from "../supabaseClient";

export class GradeRepository {
  async getGradesByStudent(student_id: number) {
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
      .eq("practice_enrollment.enrollment.student_id", student_id);

    if (practiceError) throw practiceError;

    const grouped: Record<string, GradeGroup> = {};

    theoryGrades?.forEach((g: any) => {
      const offering = g.enrollment?.course_offerings;
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
        };
      }
      grouped[offeringId].theoryScores.push(g);
    });

    practiceGrades?.forEach((g: any) => {
      const offering = g.practice_enrollment?.enrollment?.course_offerings;
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

    const grouped: Record<string, any> = {};

    theoryGrades?.forEach((g: any) => {
      const student = g.enrollment?.students;
      if (!student) return;

      const studentId = student.id;
      if (!grouped[studentId]) {
        grouped[studentId] = {
          student_id: studentId,
          student_name: student.users.full_name,
          offering: g.enrollment.course_offerings,
          theoryScores: [],
          practiceScores: []
        };
      }

      // Chỉ push field cần thiết
      grouped[studentId].theoryScores.push({
        id: g.id,
        type: g.score_type,
        score: g.score,
        comment: g.comment
      });
    });

    // Gộp điểm thực hành
    practiceGrades?.forEach((g: any) => {
      const student = g.practice_enrollment?.enrollment?.students;
      if (!student) return;

      const studentId = student.id;
      if (!grouped[studentId]) {
        grouped[studentId] = {
          student_id: studentId,
          student_name: student.users.full_name,
          offering: g.practice_enrollment.enrollment.course_offerings,
          theoryScores: [],
          practiceScores: []
        };
      }

      grouped[studentId].practiceScores.push({
        id: g.id,
        type: g.score_type,
        score: g.score,
        comment: g.comment,
        practice_group: g.practice_enrollment?.practice_groups
      });
    });

    return Object.values(grouped);
  }

  async getStudentGradesInOffering(studentId: number, offeringId: number) {
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
        offering_id
      )
    `)
      .eq("enrollment.student_id", studentId)
      .eq("enrollment.offering_id", offeringId);

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
          offering_id
        ),
        practice_groups:group_id (
          id,
          group_number,
          lecturer_id
        )
      )
    `)
      .eq("practice_enrollment.enrollment.student_id", studentId)
      .eq("practice_enrollment.enrollment.offering_id", offeringId);

    if (practiceError) throw practiceError;

    return {
      student_id: studentId,
      theoryScores: theoryGrades?.map(g => ({
        id: g.id,
        type: g.score_type,
        score: g.score,
        comment: g.comment
      })) ?? [],
      practiceScores: practiceGrades?.map(g => ({
        id: g.id,
        type: g.score_type,
        score: g.score,
        comment: g.comment,
        practice_group: g.practice_enrollment?.practice_groups
      })) ?? []
    };
  }
}
