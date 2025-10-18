import { supabase } from "../supabaseClient"

export class StudentRepository {
  async getStudentInOffering(offeringId: number, studentId: number) {
    const { data, error } = await supabase
      .from("enrollment")
      .select(`
        id,
        students:student_id (
          id,
          student_code,
          date_of_birth,
          place_of_birth,
          contact_address,
          class_id,
          classes:class_id (
            id,
            name
          ),
          academic_status,
          type_of_tranning,
          training_level,
          academic_year,
          place_of_birth,
          users (
            id,
            full_name,
            phone,
            email,
            avatar_url,
            citizen_id_card,
            ethnic, 
            avatar_url
          ),
          student_parent (
            relationship,
            parents:parent_id (
              id,
              occupation,
              users (
                id,
                full_name,
                phone,
                email
              )
            )
          )
        ),
        course_offerings:offering_id (
          id,
          name,
          class_code,
          lecturer_id
        )
      `)
      .eq("offering_id", offeringId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (error) throw error
    return data
  }

  async getOfferingLecturer(offeringId: number) {
    const { data, error } = await supabase
      .from("course_offerings")
      .select("id, lecturer_id, name")
      .eq("id", offeringId)
      .single()

    if (error) throw error
    return data
  }

  //Lấy danh sách sinh viên (id, student_code, full_name, class_name, faculty_name, academic_status)
  async getListStudent() {
    const { data, error } = await supabase
      .from("students")
      .select(`
        id,
        student_code,
        academic_status,
        classes:class_id (
          id,
          class_code,
          name,
          majors:major_id (
            id,
            faculties:faculty_id (
              id,
              name
            )
          )
        ),
        users (
          id,
          full_name
        )
      `);

    if (error) throw error;
    const students = data.map((item: any) => ({
      id: item.id,
      student_code: item.student_code,
      full_name: item.users?.full_name || "",
      class_name: item.classes?.name || "",
      class_code: item.classes?.class_code || "",
      faculty_name:
        item.classes?.majors?.faculties?.name || "",
      academic_status: item.academic_status || "",
    }));

    return students;
  }

  async getStudentGPAById(studentId: string) {
    const { data: enrolls, error: enrollErr } = await supabase
      .from("enrollment")
      .select(`
        id,
        students:student_id ( student_code ),
        course_offerings:offering_id ( course:course_id ( id, credit, semester_id ) )
      `)
      .eq("student_id", studentId);
    if (enrollErr) throw enrollErr;
    if (!enrolls || enrolls.length === 0) return null;

    type EnrollRow = {
      id: number;
      students?: { student_code?: string | null } | null;
      course_offerings?: { course?: { id?: number | null; credit?: number | null; semester_id?: number | null } | null } | null;
    };
    const rows = enrolls as unknown as EnrollRow[];

    const semesterIds = rows
      .map((r) => r.course_offerings?.course?.semester_id)
      .filter((s): s is number => typeof s === "number");
    const latestSemesterId = semesterIds.length ? Math.max(...semesterIds) : null;
    if (!latestSemesterId) return null;

    const latestEnrollments = rows.filter((r) => r.course_offerings?.course?.semester_id === latestSemesterId);
    const latestEnrollmentIds = latestEnrollments.map((r) => r.id);
    if (latestEnrollmentIds.length === 0) return null;

    const { data: summaries, error: sumErr } = await supabase
      .from("grade_summary")
      .select("enrollment_id, gpa4, total_score")
      .in("enrollment_id", latestEnrollmentIds);
    if (sumErr) throw sumErr;
    if (!summaries || summaries.length === 0) return null;

    const creditMap = new Map<number, number>();
    latestEnrollments.forEach((r) => {
      const credit = r.course_offerings?.course?.credit ?? 0;
      creditMap.set(r.id, Number(credit) || 0);
    });

    let numerator = 0;
    let denominator = 0;
    summaries.forEach((s: any) => {
      const g = typeof s.gpa4 === "number" ? s.gpa4 : null;
      const cr = creditMap.get(s.enrollment_id) ?? 0;
      if (g != null && cr > 0) {
        numerator += g * cr;
        denominator += cr;
      }
    });

    const gpa = denominator > 0 ? Number((numerator / denominator).toFixed(2)) : null;

    return {
      student_id: studentId,
      student_code: rows[0]?.students?.student_code || "",
      semester_id: latestSemesterId,
      gpa,
    };
  }

  async getStudentFailedCourses(studentId: string, semesterId?: number, computeFromRaw?: boolean) {
    // 1) Get all enrollments for the student with course info
    const { data: enrolls, error: enrollErr } = await supabase
      .from("enrollment")
      .select(`
        id,
        course_offerings:offering_id (
          id,
          course:course_id (
            id,
            course_code,
            name,
            credit,
            semester_id
          )
        )
      `)
      .eq("student_id", studentId);
    if (enrollErr) throw enrollErr;

    if (!enrolls || enrolls.length === 0)
      return { student_id: studentId, failed_count: 0, failed_courses: [] as Array<{ course_code: string; name: string; score: number | null }> };

    type EnrollRow = {
      id: number;
      course_offerings?: { course?: { id?: number | null; course_code?: string | null; name?: string | null; credit?: number | null; semester_id?: number | null } | null } | null;
    };
    const rows = enrolls as unknown as EnrollRow[];

    const enrollmentIds = rows.map((r) => r.id);

    // If caller wants to compute from raw grades (when grade_summary is missing or for testing)
    if (computeFromRaw) {
      // Optional pre-filter enrollments by semester
      const enrollFilterSet = new Set<number>();
      rows.forEach((r) => {
        const sem = r.course_offerings?.course?.semester_id ?? null;
        if (typeof semesterId === "number") {
          if (sem === semesterId) enrollFilterSet.add(r.id);
        } else {
          enrollFilterSet.add(r.id);
        }
      });
      const filteredEnrollmentIds = Array.from(enrollFilterSet);
      if (filteredEnrollmentIds.length === 0) {
        return { student_id: studentId, failed_count: 0, failed_courses: [] as Array<{ course_code: string; name: string; score: number | null }> };
      }

      // Get practice enrollment ids for these enrollments
      const { data: peRows, error: peErr } = await supabase
        .from("practice_enrollment")
        .select("id, enrollment_id")
        .in("enrollment_id", filteredEnrollmentIds);
      if (peErr) throw peErr;

      const practiceEnrollmentByEnroll = new Map<number, number[]>();
      const practiceEnrollmentIds: number[] = [];
      (peRows ?? []).forEach((p) => {
        if (typeof p.enrollment_id === "number" && typeof p.id === "number") {
          practiceEnrollmentIds.push(p.id);
          const list = practiceEnrollmentByEnroll.get(p.enrollment_id) ?? [];
          list.push(p.id);
          practiceEnrollmentByEnroll.set(p.enrollment_id, list);
        }
      });

      // Fetch grades for theory (enrollment_id) and practice (practice_enrollment_id)
      // We keep it to essential fields
      let theoryGrades: any[] = [];
      if (filteredEnrollmentIds.length > 0) {
        const { data, error } = await supabase
          .from("grades")
          .select("id, score_type, score, enrollment_id")
          .in("enrollment_id", filteredEnrollmentIds);
        if (error) throw error;
        theoryGrades = data ?? [];
      }

      let practiceGrades: any[] = [];
      if (practiceEnrollmentIds.length > 0) {
        const { data, error } = await supabase
          .from("grades")
          .select("id, score_type, score, practice_enrollment_id")
          .in("practice_enrollment_id", practiceEnrollmentIds);
        if (error) throw error;
        practiceGrades = data ?? [];
      }

      // Prepare course info map
      const courseByEnrollment = new Map<number, { course_code: string; name: string; semester_id: number | null }>();
      rows.forEach((r) => {
        const c = r.course_offerings?.course;
        if (!c) return;
        courseByEnrollment.set(r.id, {
          course_code: String(c.course_code ?? ""),
          name: String(c.name ?? ""),
          semester_id: (typeof c.semester_id === "number" ? c.semester_id : null),
        });
      });

      // Compute per enrollment
      const failedCourses: Array<{ course_code: string; name: string; score: number | null }> = [];
      const THRESHOLD = 5.0; // Assumption: pass if total >= 5.0 (scale 0-10)

      filteredEnrollmentIds.forEach((enrollId) => {
        const info = courseByEnrollment.get(enrollId);
        if (!info) return;

        const tGrades = theoryGrades.filter((g) => g.enrollment_id === enrollId && typeof g.score === "number");
        const pIds = practiceEnrollmentByEnroll.get(enrollId) ?? [];
        const pGrades = practiceGrades.filter((g) => g.practice_enrollment_id && pIds.includes(g.practice_enrollment_id) && typeof g.score === "number");

        // Normalize types
        const getByType = (arr: any[], type: string) =>
          arr.filter((g) => String(g.score_type || "").toLowerCase() === type);

        const midterm = getByType(tGrades, "midterm");
        const final = getByType(tGrades, "final");
        const midtermScore = midterm.length ? midterm[midterm.length - 1].score as number : null;
        const finalScore = final.length ? final[final.length - 1].score as number : null;

        let theoryScore: number | null = null;
        if (midtermScore != null && finalScore != null) {
          theoryScore = 0.4 * midtermScore + 0.6 * finalScore; // Assumption
        } else if (finalScore != null) {
          theoryScore = finalScore;
        } else if (midtermScore != null) {
          theoryScore = midtermScore;
        } else if (tGrades.length > 0) {
          // Average of available theory scores if types unknown
          const sum = tGrades.reduce((acc, g) => acc + (g.score as number), 0);
          theoryScore = sum / tGrades.length;
        }

        let practiceAvg: number | null = null;
        if (pGrades.length > 0) {
          const sum = pGrades.reduce((acc, g) => acc + (g.score as number), 0);
          practiceAvg = sum / pGrades.length;
        }

        let finalCourseScore: number | null = null;
        if (theoryScore != null && practiceAvg != null) {
          finalCourseScore = 0.8 * theoryScore + 0.2 * practiceAvg; // Assumption: 80% theory, 20% practice
        } else if (theoryScore != null) {
          finalCourseScore = theoryScore;
        } else if (practiceAvg != null) {
          finalCourseScore = practiceAvg; // If only practice exists, use it
        }

        if (finalCourseScore != null && finalCourseScore < THRESHOLD) {
          failedCourses.push({
            course_code: info.course_code,
            name: info.name,
            score: Number(finalCourseScore.toFixed(2)),
          });
        }
      });

      return {
        student_id: studentId,
        failed_count: failedCourses.length,
        failed_courses: failedCourses,
      };
    }

    // 2) Default: Use grade_summary passed=false when available
    const { data: summaries, error: sumErr } = await supabase
      .from("grade_summary")
      .select("enrollment_id, total_score, passed")
      .in("enrollment_id", enrollmentIds)
      .eq("passed", false);
    if (sumErr) throw sumErr;

    if (!summaries || summaries.length === 0)
      return { student_id: studentId, failed_count: 0, failed_courses: [] as Array<{ course_code: string; name: string; score: number | null }> };

    // 3) Build a map from enrollment -> course info
    const courseByEnrollment = new Map<number, { course_code: string; name: string; semester_id: number | null }>();
    rows.forEach((r) => {
      const c = r.course_offerings?.course;
      if (!c) return;
      courseByEnrollment.set(r.id, {
        course_code: String(c.course_code ?? ""),
        name: String(c.name ?? ""),
        semester_id: (typeof c.semester_id === "number" ? c.semester_id : null),
      });
    });

    // 4) Combine and optionally filter by semesterId
    const failedCoursesRaw = summaries
      .map((s) => {
        const info = courseByEnrollment.get(s.enrollment_id);
        if (!info) return null;
        return {
          course_code: info.course_code,
          name: info.name,
          score: typeof (s as any).total_score === "number" ? (s as any).total_score as number : null,
          semester_id: info.semester_id,
        };
      })
      .filter((v): v is { course_code: string; name: string; score: number | null; semester_id: number | null } => !!v);

    const filtered = typeof semesterId === "number"
      ? failedCoursesRaw.filter((c) => c.semester_id === semesterId)
      : failedCoursesRaw;

    const failed_courses = filtered.map(({ semester_id, ...rest }) => rest);

    return {
      student_id: studentId,
      failed_count: failed_courses.length,
      failed_courses,
    };
  }
}
