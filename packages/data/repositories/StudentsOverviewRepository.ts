import { supabase } from "@packages/data/supabaseClient";

export type StudentsOverviewRow = {
  student_id: number;
  student_code: string;
  full_name: string;
  class: string;
  faculty: string;
  semester: string | null;
  semester_id: number | null;
  gpa: number | null;
  failed_subjects: number;
  total_warning: number;
  academic_status: string;
  attendance_rate: number | null;
  latest_warning: string | null;
  proposed_warning_level: number;
  proposed_action: string;
};

export type StudentsOverviewResult = {
  items: StudentsOverviewRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

interface GradeData {
  gpa4: number | null;
  failedCount: number;
}

interface WarningData {
  total: number;
  latestDate: string | null;
}

export class StudentsOverviewRepository {
  async getOverview(params: {
    semesterId?: number;
    studentIds?: number[];
    page?: number;
    pageSize?: number;
    search?: string;
    gpaMin?: number;
    gpaMax?: number;
  }): Promise<StudentsOverviewResult> {
    const {
      semesterId,
      studentIds: filterStudentIds,
      page: rawPage = 1,
      pageSize: rawPageSize = 20,
      search = "",
      gpaMin,
      gpaMax,
    } = params;

    const page = Math.max(1, Math.floor(rawPage));
    const pageSize = Math.min(100, Math.max(1, Math.floor(rawPageSize)));
    const offset = (page - 1) * pageSize;
    const needGpaFilter = gpaMin != null || gpaMax != null;

    // Step 1: lightweight base students list
    const baseStudents = await this.getBaseStudents({
      studentIds: filterStudentIds,
      search: search.trim(),
    });
    if (baseStudents.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    let studentsToProcess = baseStudents;
    let totalCount = baseStudents.length;

    if (!needGpaFilter) {
      studentsToProcess = baseStudents.slice(offset, offset + pageSize);
    }

    const studentIds = studentsToProcess.map((s) => s.student_id);

    // Step 3: semester map (fixed if provided, else latest)
    const semesterIdMap = semesterId
      ? this.createFixedSemesterMap(studentIds, semesterId)
      : await this.batchGetLatestSemesters(studentIds);

    // Step 4: batch data loads in parallel
    const [gradesMap, warningsMap, attendanceMap, semesterNames] = await Promise.all([
      this.batchGetGrades(studentIds, semesterIdMap),
      this.batchGetWarnings(studentIds, semesterIdMap),
      this.batchGetAttendance(studentIds, semesterIdMap),
      this.batchGetSemesterNames(
        Array.from(new Set(semesterIdMap.values())).filter(Boolean) as number[]
      ),
    ]);

    // Step 5: GPA filter if needed (after having grades)
    let finalStudents = studentsToProcess;
    if (needGpaFilter) {
      finalStudents = studentsToProcess.filter((s) => {
        const grades = gradesMap.get(s.student_id);
        const gpa = grades?.gpa4 ?? null;
        if (gpa == null) return false;
        const passMin = gpaMin != null ? gpa >= gpaMin : true;
        const passMax = gpaMax != null ? gpa <= gpaMax : true;
        return passMin && passMax;
      });
      totalCount = finalStudents.length;
      finalStudents = finalStudents.slice(offset, offset + pageSize);
    } else {
      totalCount = baseStudents.length;
    }

    // Step 6: final mapping
    const items: StudentsOverviewRow[] = finalStudents.map((student) => {
      const sid = student.student_id;
      const semId = semesterIdMap.get(sid) ?? null;
      const grades = gradesMap.get(sid) ?? { gpa4: null, failedCount: 0 };
      const warnings = warningsMap.get(sid) ?? { total: 0, latestDate: null };
      const attendance = attendanceMap.get(sid) ?? null;
      const semesterName = semId ? semesterNames.get(semId) ?? null : null;
      // Proposal calculation based on GPA only (ignore attendance and failed subjects)
      const gpa = grades.gpa4;
      let proposedLevel = 0;
      let proposedReason = "";
      if (typeof gpa === "number") {
        if (gpa < 1.0) {
          proposedLevel = 3;
          proposedReason = "GPA < 1.0";
        } else if (gpa < 2.0) {
          proposedLevel = 2;
          proposedReason = "GPA < 2.0";
        } else if (gpa < 2.5) {
          proposedLevel = 1;
          proposedReason = "GPA < 2.5";
        }
      }
      const proposedLabel =
        proposedLevel === 0
          ? ""
          : proposedLevel === 3
          ? `Đề xuất Cảnh cáo 3: ${proposedReason}`
          : proposedLevel === 2
          ? `Đề xuất Cảnh cáo 2: ${proposedReason}`
          : `Đề xuất Cảnh cáo 1: ${proposedReason}`;

      return {
        student_id: sid,
        student_code: student.student_code,
        full_name: student.full_name,
        class: student.class,
        faculty: student.faculty,
        semester: semesterName,
        semester_id: semId,
        gpa: grades.gpa4,
        failed_subjects: grades.failedCount,
        total_warning: warnings.total,
        academic_status: student.academic_status,
        attendance_rate: attendance,
        latest_warning: warnings.latestDate,
        proposed_warning_level: proposedLevel,
        proposed_action: proposedLabel,
      };
    });

    return {
      items,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    };
  }

  // ===== batch helpers =====
  private async getBaseStudents(params: {
    studentIds?: number[];
    search?: string;
  }): Promise<
    Array<{
      student_id: number;
      student_code: string;
      full_name: string;
      class: string;
      faculty: string;
      academic_status: string;
    }>
  > {
    let query = supabase
      .from("students")
      .select(
        `
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
      `
      )
      .order("student_code", { ascending: true });

    if (params.studentIds && params.studentIds.length > 0) {
      query = query.in("id", params.studentIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    let students = (data ?? []).map((s: any) => ({
      student_id: s.id,
      student_code: s.student_code || "",
      full_name: s.users?.full_name || "",
      class: s.classes?.class_code || s.classes?.name || "",
      faculty: s.classes?.majors?.faculties?.name || "",
      academic_status: s.academic_status || "active",
    }));

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      students = students.filter(
        (s) =>
          s.student_code.toLowerCase().includes(searchLower) ||
          s.full_name.toLowerCase().includes(searchLower)
      );
    }

    return students;
  }

  private async batchGetLatestSemesters(studentIds: number[]): Promise<Map<number, number | null>> {
    if (studentIds.length === 0) return new Map();
    const { data, error } = await supabase
      .from("enrollment")
      .select(
        `
        student_id,
        course_offerings:offering_id (
          course:course_id (
            semester_id
          )
        )
      `
      )
      .in("student_id", studentIds);
    if (error) throw error;

    const grouped = new Map<number, number[]>();
    (data ?? []).forEach((row: any) => {
      const sid = row.student_id;
  const semId = row.course_offerings?.course?.semester_id;
      if (typeof semId === "number") {
        if (!grouped.has(sid)) grouped.set(sid, []);
        grouped.get(sid)!.push(semId);
      }
    });
    const result = new Map<number, number | null>();
    studentIds.forEach((sid) => {
      const semesters = grouped.get(sid);
      result.set(sid, semesters && semesters.length > 0 ? Math.max(...semesters) : null);
    });
    return result;
  }

  private async batchGetGrades(
    studentIds: number[],
    semesterIdMap: Map<number, number | null>
  ): Promise<Map<number, GradeData>> {
    if (studentIds.length === 0) return new Map();

    // Determine target semesters present
    const targetSemesterIds = Array.from(new Set(semesterIdMap.values())).filter(
      (id): id is number => id != null
    );
    if (targetSemesterIds.length === 0) {
      return new Map(studentIds.map((id) => [id, { gpa4: null, failedCount: 0 }]));
    }

    // 1) Get enrollments for students in their target semester
    const { data: enrollments, error: enrErr } = await supabase
      .from("enrollment")
      .select(
        `
        id,
        student_id,
        course_offerings:offering_id (
          course:course_id (
            credit,
            semester_id
          )
        )
      `
      )
      .in("student_id", studentIds);
    if (enrErr) throw enrErr;

    // Build per-student enrollment ids for their target semester and credit map
    const perStudentEnrollments = new Map<number, Array<{ id: number; credit: number }>>();
    (enrollments ?? []).forEach((e: any) => {
      const sid = e.student_id as number;
      const semId = e.course_offerings?.course?.semester_id as number | undefined;
      const credit = Number(e.course_offerings?.course?.credit ?? 0) || 0;
      const targetSem = semesterIdMap.get(sid) ?? null;
      if (targetSem != null && semId === targetSem) {
        if (!perStudentEnrollments.has(sid)) perStudentEnrollments.set(sid, []);
        perStudentEnrollments.get(sid)!.push({ id: e.id as number, credit });
      }
    });

    const allEnrollmentIds = Array.from(perStudentEnrollments.values())
      .flat()
      .map((x) => x.id);

    if (allEnrollmentIds.length === 0) {
      return new Map(studentIds.map((id) => [id, { gpa4: null, failedCount: 0 }]));
    }

    // 2) Fetch grade summaries for those enrollments
    const { data: summaries, error: sumErr } = await supabase
      .from("grade_summary")
      .select("enrollment_id, gpa4, passed")
      .in("enrollment_id", allEnrollmentIds);
    if (sumErr) throw sumErr;

    const result = new Map<number, GradeData>();

    studentIds.forEach((sid) => {
      const enrolls = perStudentEnrollments.get(sid) ?? [];
      if (enrolls.length === 0) {
        result.set(sid, { gpa4: null, failedCount: 0 });
        return;
      }
      let numerator = 0;
      let denominator = 0;
      let failedCount = 0;
      enrolls.forEach(({ id, credit }) => {
        const rec = (summaries ?? []).find((s: any) => s.enrollment_id === id);
        const g = typeof rec?.gpa4 === "number" ? rec.gpa4 : null;
        const passed = typeof rec?.passed === "boolean" ? rec.passed : undefined;
        if (g != null && credit > 0) {
          numerator += g * credit;
          denominator += credit;
        }
        if (passed === false) failedCount += 1;
      });
      const gpa4 = denominator > 0 ? Math.round((numerator / denominator) * 100) / 100 : null;
      result.set(sid, { gpa4, failedCount });
    });

    return result;
  }

  private async batchGetWarnings(
    studentIds: number[],
    semesterIdMap: Map<number, number | null>
  ): Promise<Map<number, WarningData>> {
    if (studentIds.length === 0) return new Map();
    const { data, error } = await supabase
      .from("academic_warnings")
      .select("student_id, semester_id, warned_at")
      .in("student_id", studentIds)
      .order("warned_at", { ascending: false });
    if (error) throw error;
    const result = new Map<number, WarningData>();
    studentIds.forEach((sid) => {
      const targetSemId = semesterIdMap.get(sid);
      const studentWarnings = (data ?? []).filter((w: any) => {
        if (w.student_id !== sid) return false;
        return targetSemId != null ? w.semester_id === targetSemId : true;
      });
      result.set(sid, {
        total: studentWarnings.length,
        latestDate: studentWarnings[0]?.warned_at ?? null,
      });
    });
    return result;
  }

  private async batchGetAttendance(
    studentIds: number[],
    semesterIdMap: Map<number, number | null>
  ): Promise<Map<number, number | null>> {
    if (studentIds.length === 0) return new Map();
    const { data: enrollments, error: enrErr } = await supabase
      .from("enrollment")
      .select(
        `
        id,
        student_id,
        course_offerings:offering_id (
          course:course_id (
            semester_id
          )
        )
      `
      )
      .in("student_id", studentIds);
    if (enrErr) throw enrErr;
    const enrollmentMap = new Map<number, number[]>();
    (enrollments ?? []).forEach((e: any) => {
      const sid = e.student_id;
  const semId = e.course_offerings?.course?.semester_id;
      const targetSemId = semesterIdMap.get(sid);
      if (targetSemId != null && semId === targetSemId) {
        if (!enrollmentMap.has(sid)) enrollmentMap.set(sid, []);
        enrollmentMap.get(sid)!.push(e.id);
      }
    });
    const allEnrollmentIds = Array.from(enrollmentMap.values()).flat();
    if (allEnrollmentIds.length === 0) {
      return new Map(studentIds.map((id) => [id, null]));
    }
    const { data: attendance, error: attErr } = await supabase
      .from("attendance")
      .select("status, enrollment_id")
      .in("enrollment_id", allEnrollmentIds);
    if (attErr) throw attErr;
    const result = new Map<number, number | null>();
    studentIds.forEach((sid) => {
      const enrollmentIds = enrollmentMap.get(sid) ?? [];
      if (enrollmentIds.length === 0) {
        result.set(sid, null);
        return;
      }
      const records = (attendance ?? []).filter((a: any) =>
        enrollmentIds.includes(a.enrollment_id)
      );
      if (records.length === 0) {
        result.set(sid, null);
        return;
      }
      let present = 0;
      let total = 0;
      records.forEach((r: any) => {
        const status = String(r.status || "").toLowerCase();
        if (status === "present") present += 1;
        if (status === "present" || status === "absent") total += 1;
      });
      result.set(
        sid,
        total === 0 ? null : Math.round((present / total) * 100 * 100) / 100
      );
    });
    return result;
  }

  private async batchGetSemesterNames(
    semesterIds: number[]
  ): Promise<Map<number, string>> {
    if (semesterIds.length === 0) return new Map();
    const { data, error } = await supabase
      .from("semesters")
      .select("id, name")
      .in("id", semesterIds);
    if (error) throw error;
    const result = new Map<number, string>();
    (data ?? []).forEach((s: any) => {
      if (s.name) result.set(s.id, s.name);
    });
    return result;
  }

  private createFixedSemesterMap(
    studentIds: number[],
    semesterId: number
  ): Map<number, number> {
    return new Map(studentIds.map((id) => [id, semesterId]));
  }

  private buildProposal(info: {
    gpa: number | null;
    failed: number;
    attendance: number | null;
    totalWarning: number;
  }): { level: number; action: string } {
    const { gpa, failed, attendance, totalWarning } = info;
    let lvlByGpa = 0;
    if (gpa != null) {
      if (gpa < 1.0) lvlByGpa = 3;
      else if (gpa < 2.0) lvlByGpa = 2;
      else if (gpa < 2.5) lvlByGpa = 1;
    }
    let lvlByFailed = 0;
    if (failed >= 5) lvlByFailed = 3;
    else if (failed >= 3) lvlByFailed = 2;
    else if (failed >= 1) lvlByFailed = 1;
    let lvlByAttend = 0;
    if (attendance != null) {
      if (attendance < 50) lvlByAttend = 3;
      else if (attendance < 70) lvlByAttend = 2;
      else if (attendance < 80) lvlByAttend = 1;
    }
    const candidateLevel = Math.max(lvlByGpa, lvlByFailed, lvlByAttend);
    if (candidateLevel === 0) {
      return { level: 0, action: "Không có đề xuất" };
    }
    const nextByHistory = Math.min((totalWarning || 0) + 1, 3);
    const proposedLevel = Math.max(candidateLevel, nextByHistory);
    const reasons: string[] = [];
    if (gpa != null) {
      if (gpa < 1.0) reasons.push("GPA < 1.0");
      else if (gpa < 2.0) reasons.push("GPA < 2.0");
      else if (gpa < 2.5) reasons.push("GPA < 2.5");
    }
    if (failed >= 5) reasons.push("Môn trượt ≥ 5");
    else if (failed >= 3) reasons.push("Môn trượt ≥ 3");
    else if (failed >= 1) reasons.push("Có môn trượt");
    if (attendance != null) {
      if (attendance < 50) reasons.push("Chuyên cần < 50%");
      else if (attendance < 70) reasons.push("Chuyên cần < 70%");
      else if (attendance < 80) reasons.push("Chuyên cần < 80%");
    }
    const label =
      proposedLevel === 1
        ? "Cảnh cáo 1"
        : proposedLevel === 2
        ? "Cảnh cáo 2"
        : "Cảnh cáo 3";
    const action = reasons.length
      ? `Đề xuất ${label}: ${reasons.join(", ")}`
      : `Đề xuất ${label}`;
    return { level: proposedLevel, action };
  }
}
