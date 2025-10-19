import { supabase } from "../supabaseClient";

type SortParam = `${string},asc` | `${string},desc`;

export class AcademicWarningRepository {
  
  async createWarning(input: { studentId: number; semesterId: number; level: string; reason: string }) {
    const { data: warning, error: warnErr } = await supabase
      .from("academic_warnings")
      .insert({
        student_id: input.studentId,
        semester_id: input.semesterId,
        level: input.level,
        reason: input.reason,
      })
      .select("id, student_id, semester_id, level, reason, warned_at")
      .single();
    if (warnErr) throw warnErr;

    const content = `Bạn nhận được cảnh cáo học vụ: ${input.reason}`;
    // Fire-and-forget notification to avoid blocking response time
    void (supabase
      .from("notifications")
      .insert({ user_id: input.studentId, content, type: "academic_warning" })
      .then(({ error }) => {
        if (error) console.error("Failed to create notification:", error.message);
      }, (e) => console.error("Notification error:", e))
    );

    return warning;
  }

  async getHistory(studentId: number) {
    const { data, error } = await supabase
      .from("academic_warnings")
      .select(`id, level, reason, warned_at, semesters:semester_id ( id, name )`)
      .eq("student_id", studentId)
      .order("warned_at", { ascending: false });
    if (error) throw error;
    return (
      data ?? []
    ).map((w: any) => ({
      id: w.id as number,
      semesterName: w.semesters?.name as string | undefined,
      level: w.level as string,
      reason: w.reason as string,
      warnedAt: w.warned_at as string,
    }));
  }

  async getStudentGrades(studentId: number, semesterId: number) {
    const { data: enrolls, error: enrollErr } = await supabase
      .from("enrollment")
      .select(`
        id,
        students:student_id ( id, student_code, users:users ( full_name ) ),
        course_offerings:offering_id ( id, course:course_id ( id, name, credit, semester_id ), name )
      `)
      .eq("student_id", studentId)
      .eq("course_offerings.course.semester_id", semesterId);
    if (enrollErr) throw enrollErr;
    const enrollmentIds = enrolls?.map((e: any) => e.id) ?? [];

    const { data: grades, error: gradesErr } = await supabase
      .from("grades")
      .select(`id, score_type, score, comment, enrollment_id`)
      .in("enrollment_id", enrollmentIds);
    if (gradesErr) throw gradesErr;

    const { data: summaries, error: sumErr } = await supabase
      .from("grade_summary")
      .select("enrollment_id, gpa4, passed, letter_grade, total_score")
      .in("enrollment_id", enrollmentIds);
    if (sumErr) throw sumErr;

    const byEnroll = new Map<number, { grades: any[]; summary: any | null; course: any }>();
    enrolls?.forEach((e: any) => {
      byEnroll.set(e.id, {
        grades: [],
        summary: summaries?.find((s) => s.enrollment_id === e.id) ?? null,
        course: e.course_offerings?.course,
      });
    });
    grades?.forEach((g: any) => {
      const bucket = byEnroll.get(g.enrollment_id);
      if (bucket) bucket.grades.push(g);
    });

    let totalCredits = 0;
    let passedSubjects = 0;
    let failedSubjects = 0;
    let gpaNumerator = 0;
    let gpaDenominator = 0;
    const gradeList: Array<{ courseName: string; credit: number; score: number | null; letterGrade: string | null; passed: boolean | null }> = [];
    byEnroll.forEach((v) => {
      const credit = v.course?.credit ?? 0;
      totalCredits += credit;
      const passed = v.summary?.passed ?? null;
      if (passed === true) passedSubjects += 1;
      else if (passed === false) failedSubjects += 1;
      if (v.summary?.gpa4 != null && credit > 0) {
        gpaNumerator += v.summary.gpa4 * credit;
        gpaDenominator += credit;
      }
      gradeList.push({
        courseName: v.course?.name ?? "",
        credit,
        score: v.summary?.total_score ?? null,
        letterGrade: v.summary?.letter_grade ?? null,
        passed,
      });
    });

    const gpa4 = gpaDenominator > 0 ? Number((gpaNumerator / gpaDenominator).toFixed(2)) : null;
    const firstEnroll = enrolls?.[0] as any;
    const studentCode = firstEnroll?.students?.student_code ?? undefined;
    const fullName = firstEnroll?.students?.users?.full_name ?? undefined;

    const { data: sem, error: semErr } = await supabase
      .from("semesters")
      .select("id, name")
      .eq("id", semesterId)
      .single();
    if (semErr) throw semErr;

    return {
      studentId,
      studentCode,
      fullName,
      semesterName: sem?.name,
      gpa4,
      summary: { passedSubjects, failedSubjects, totalCredits },
      grades: gradeList,
    };
  }

  async getWarningsForStudent(studentId: number, semesterId?: number) {
    let query = supabase
      .from("academic_warnings")
      .select("id, student_id, semester_id, level, reason, warned_at")
      .eq("student_id", studentId)
      .order("warned_at", { ascending: false });

    if (typeof semesterId === "number") {
      query = query.eq("semester_id", semesterId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const warnings = (data ?? []).map((w: any) => ({
      id: w.id as number,
      student_id: w.student_id as number,
      semester_id: w.semester_id as number,
      level: w.level as string,
      reason: w.reason as string,
      warned_at: w.warned_at as string,
    }));

    return {
      student_id: studentId,
      semester_id: semesterId ?? null,
      total_warning: warnings.length,
      warnings,
    } as const;
  }
}
