import { Grade, GradeGroup } from "@packages/core/entities/Grade";
import { supabase } from "../supabaseClient";

type Enrollment = {
  students: any;
  student_id: any;
  id: number;
  offering_id: number;
  course_offerings: CourseOffering;
};

type EnrollmentJoin = {
  id: number;
  student_id: number;
  course_offerings: CourseOffering;
};

type TheoryGrade = {
  enrollment_id: number;
  id: number;
  score_type: string;
  score: number;
  comment: string;
  enrollment: EnrollmentJoin;
};

type PracticeGroup = {
  id: number;
  group_number: number;
};

type PracticeEnrollment = {
  id: number;
  enrollment_id: number;
  group_id: number;
  enrollment: EnrollmentJoin;
  practice_groups: PracticeGroup;
};

type PracticeGradeRaw = {
  id: number;
  score_type: string;
  score: number;
  comment: string;
  practice_enrollment_id: number;
};

type GradeSummary = {
  enrollment_id: number;
  [k: string]: any;
};

type Course = {
  id: number;
  name: string;
  course_code: string;
  credit: number;
  semester_id: number;
};

type CourseOffering = {
  semester_id: number;
  id: number;
  name: string;
  class_code: string;
  lecturer_id: number;
  course: Course;
};

type PracticeGrade = {
  id: number;
  score_type: string;
  score: number;
  comment: string;
  practice_enrollment_id: number;
};

export class GradeRepository {
  async getGradesByStudent(student_id: number, semesterId?: number) {

    const { data: rawEnrollments, error: e1 } = await supabase
      .from("enrollment")
      .select(`
      id,
      offering_id,
      course_offerings:offering_id (
        id,
        name,
        class_code,
        lecturer_id,
        semester_id
      )
    `)
      .eq("student_id", student_id);

    if (e1) throw e1;

    if (!rawEnrollments || rawEnrollments.length === 0) return [];

    const enrollments = rawEnrollments as unknown as Enrollment[];

    const validEnrollments = semesterId
      ? enrollments.filter(e => e.course_offerings.semester_id === semesterId)
      : enrollments;

    const enrollmentIds = validEnrollments.map(e => e.id);

    const { data: rawTheoryGrades, error: theoryError } = await supabase
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
          semester_id
        )
      )
    `)
      .in("enrollment_id", enrollmentIds);

    if (theoryError) throw theoryError;

    const theoryGrades = rawTheoryGrades as unknown as TheoryGrade[];

    const { data: rawPracticeEnrollments, error: e2 } = await supabase
      .from("practice_enrollment")
      .select(`
      id,
      enrollment_id,
      group_id,
      enrollment:enrollment_id (
        id,
        student_id,
        course_offerings:offering_id (
          id,
          name,
          class_code,
          lecturer_id,
          semester_id
        )
      ),
      practice_groups:group_id (
        id,
        group_number
      )
    `)
      .in("enrollment_id", enrollmentIds);

    if (e2) throw e2;

    const practiceEnrollments = rawPracticeEnrollments as unknown as PracticeEnrollment[];
    const practiceEnrollmentIds = practiceEnrollments.map(p => p.id);

    const { data: rawPracticeGrades, error: practiceError } = await supabase
      .from("grades")
      .select(`
      id,
      score_type,
      score,
      comment,
      practice_enrollment_id
    `)
      .in("practice_enrollment_id", practiceEnrollmentIds);

    if (practiceError) throw practiceError;

    const practiceGradesRaw = rawPracticeGrades as PracticeGradeRaw[];

    const fullPracticeGrades = practiceGradesRaw.map(pg => {
      const pEnroll = practiceEnrollments.find(p => p.id === pg.practice_enrollment_id)!;
      return {
        ...pg,
        practice_enrollment: pEnroll,
      };
    });

    let gradeSummaries: Record<number, GradeSummary> = {};

    if (enrollmentIds.length > 0) {
      const { data: summaries, error: sErr } = await supabase
        .from("grade_summary")
        .select("*")
        .in("enrollment_id", enrollmentIds);

      if (sErr) throw sErr;

      gradeSummaries = (summaries as GradeSummary[]).reduce((acc, s) => {
        acc[s.enrollment_id] = s;
        return acc;
      }, {} as Record<number, GradeSummary>);
    }

    const grouped: Record<number, any> = {};

    theoryGrades.forEach(g => {
      const offering = g.enrollment.course_offerings;
      const offeringId = offering.id;

      if (!grouped[offeringId]) {
        grouped[offeringId] = {
          offering_id: offering.id,
          offering_name: offering.name,
          class_code: offering.class_code,
          lecturer_id: offering.lecturer_id,
          theoryScores: [],
          practiceScores: [],
          summary: gradeSummaries[g.enrollment.id] || null,
        };
      }

      grouped[offeringId].theoryScores.push(g);
    });

    fullPracticeGrades.forEach(g => {
      const offering = g.practice_enrollment.enrollment.course_offerings;
      const offeringId = offering.id;
      const enrollmentId = g.practice_enrollment.enrollment.id;

      if (!grouped[offeringId]) {
        grouped[offeringId] = {
          offering_id: offering.id,
          offering_name: offering.name,
          class_code: offering.class_code,
          lecturer_id: offering.lecturer_id,
          theoryScores: [],
          practiceScores: [],
          summary: gradeSummaries[enrollmentId] || null,
        };
      }

      grouped[offeringId].practiceScores.push({
        ...g,
        practice_group: g.practice_enrollment.practice_groups,
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
      .not("practice_enrollment", "is", null);

    if (practiceError) throw practiceError;

    return {
      theoryScores: theoryData ?? [],
      practiceScores: practiceData ?? [],
    };
  }

  async getAllGradesByOffering(offeringId: number) {

    const { data: rawEnrollments, error: e1 } = await supabase
      .from("enrollment")
      .select(`
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
    `)
      .eq("offering_id", offeringId);

    if (e1) throw e1;
    if (!rawEnrollments || rawEnrollments.length === 0) return [];

    // ép kiểu
    const enrollments = rawEnrollments as unknown as Enrollment[];

    const enrollmentIds = enrollments.map(e => e.id);

    //
    // ===== STEP 2: Theory grades =====
    //
    const { data: rawTheory, error: tErr } = await supabase
      .from("grades")
      .select(`id, score_type, score, comment, enrollment_id`)
      .in("enrollment_id", enrollmentIds);

    if (tErr) throw tErr;

    const theoryGrades = rawTheory as unknown as TheoryGrade[];

    //
    // ===== STEP 3: Practice enrollment =====
    //
    const { data: rawPracticeEnrollments, error: e2 } = await supabase
      .from("practice_enrollment")
      .select(`
      id,
      enrollment_id,
      group_id,
      practice_groups:group_id (
        id,
        group_number,
        lecturer_id
      )
    `)
      .in("enrollment_id", enrollmentIds);

    if (e2) throw e2;

    const practiceEnrollmentList = rawPracticeEnrollments as unknown as PracticeEnrollment[];

    const practiceEnrollmentIds = practiceEnrollmentList.map(p => p.id);

    //
    // ===== STEP 4: Practice grades =====
    //
    const { data: rawPracticeGrades, error: pErr } = await supabase
      .from("grades")
      .select(`id, score_type, score, comment, practice_enrollment_id`)
      .in("practice_enrollment_id", practiceEnrollmentIds);

    if (pErr) throw pErr;

    const practiceGrades = rawPracticeGrades as PracticeGrade[];

    //
    // ===== STEP 5: Grade summary =====
    //
    const { data: rawSummaries, error: sErr } = await supabase
      .from("grade_summary")
      .select("*")
      .in("enrollment_id", enrollmentIds);

    if (sErr) throw sErr;

    const summaryMap = (rawSummaries as GradeSummary[]).reduce((acc, s) => {
      acc[s.enrollment_id] = s;
      return acc;
    }, {} as Record<number, GradeSummary>);

    //
    // ===== STEP 6: group by student =====
    //
    const grouped: Record<number, any> = {};

    // init student entries
    for (const e of enrollments) {
      grouped[e.student_id] = {
        student_id: e.student_id,
        student_code: e.students.student_code,
        student_name: e.students.users.full_name,
        offering: e.course_offerings,
        theoryScores: [],
        practiceScores: [],
        practice_group_number: null,
        summary: summaryMap[e.id] ?? null,
      };
    }

    //
    // attach theory grades
    //
    theoryGrades.forEach(g => {
      const enrollment = enrollments.find(e => e.id === g.enrollment_id);
      if (!enrollment) return;

      grouped[enrollment.student_id].theoryScores.push({
        id: g.id,
        type: g.score_type,
        score: g.score,
        comment: g.comment,
      });
    });

    //
    // attach practice grades
    //
    practiceGrades.forEach(g => {
      const pEnroll = practiceEnrollmentList.find(p => p.id === g.practice_enrollment_id);
      if (!pEnroll) return;

      const enrollment = enrollments.find(e => e.id === pEnroll.enrollment_id);
      if (!enrollment) return;

      grouped[enrollment.student_id].practiceScores.push({
        id: g.id,
        type: g.score_type,
        score: g.score,
        comment: g.comment,
        practice_group: pEnroll.practice_groups,
      });

      if (!grouped[enrollment.student_id].practice_group_number) {
        grouped[enrollment.student_id].practice_group_number =
          pEnroll.practice_groups?.group_number ?? null;
      }
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
