import { supabase } from "../supabaseClient";

export class GradeRepository {
  async getGradesByStudent(student_id: number) {
    const { data, error } = await supabase
      .from("grades")
      .select(`
        id,
        score_type,
        score,
        comment,
        enrollment:enrollment_id(
          id,
          offering:offering_id(
            id,
            name,
            class_code,
            course:course_id(
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

    if (error) throw error;

    const grouped: Record<string, any> = {};

    data.forEach((g: any) => {
      const offeringId = g.enrollment.offering.id;
      if (!grouped[offeringId]) {
        grouped[offeringId] = {
          offering_id: offeringId,
          offering_name: g.enrollment.offering.name,
          class_code: g.enrollment.offering.class_code,
          course: g.enrollment.offering.course,
          lecturer_id: g.enrollment.offering.lecturer_id,
          theoryScores: [],
          practiceScores: [],
        };
      }

      if (g.score_type.includes("practice")) {
        grouped[offeringId].practiceScores.push(g);
      } else {
        grouped[offeringId].theoryScores.push(g);
      }
    });

    return Object.values(grouped);
  }

  async getGradesByOffering(student_id: number, offering_id: number) {
    const { data, error } = await supabase
      .from("grades")
      .select(`
        id,
        score_type,
        score,
        comment,
        enrollment:enrollment_id(
          id,
          student_id,
          offering:offering_id(
            id,
            name,
            class_code,
            course:course_id(
              id,
              name,
              course_code,
              credit
            ),
            lecturer_id
          )
        )
      `)
      .eq("enrollment.student_id", student_id)
      .eq("enrollment.offering_id", offering_id);

    if (error) throw error;

    const theoryScores = data.filter((g: any) => !g.score_type.includes("practice"));
    const practiceScores = data.filter((g: any) => g.score_type.includes("practice"));

    return { theoryScores, practiceScores };
  }
}
