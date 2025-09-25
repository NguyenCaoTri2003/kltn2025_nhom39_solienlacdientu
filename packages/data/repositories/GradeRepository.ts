import { Grade, GradeGroup } from "@/core/entities/Grade";
import { supabase } from "../supabaseClient";

export class GradeRepository {
  async getGradesByStudent(student_id: string) {
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


  async getGradesByOffering(student_id: string, offering_id: number) {
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
      .eq("enrollment.offering_id", offering_id);

    if (theoryError) throw theoryError;

    const { data: practiceData, error: practiceError } = await supabase
      .from("grades")
      .select(`
        id,
        score_type,
        score,
        comment,
        practice_enrollment:enrollment_id (
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
      .eq("practice_enrollment.enrollment.offering_id", offering_id);

    if (practiceError) throw practiceError;

    return {
      theoryScores: theoryData ?? [],
      practiceScores: practiceData ?? [],
    };
  }
}
