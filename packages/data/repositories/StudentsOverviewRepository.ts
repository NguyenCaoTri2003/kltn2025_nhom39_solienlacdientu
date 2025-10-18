import { supabase } from "@packages/data/supabaseClient";
import { StudentRepository } from "@packages/data/repositories/StudentRepository";
import { AcademicWarningUseCase } from "@packages/core/usecases/AcademicWarningUseCase";

export type StudentsOverviewRow = {
  student_id: number | string;
  student_code: string;
  full_name: string;
  class: string;
  faculty: string;
  semester: string | null;
  semester_id?: number | null;
  gpa: number | null;
  failed_subjects: number;
  total_warning: number; // total_warning
  academic_status: string;
  attendance_rate: number | null;
  latest_warning: string | null;
  // Auto proposal for admin to create an academic warning
  proposed_warning_level?: number; // 0..3
  proposed_action?: string; // e.g., "Đề xuất Cảnh cáo 2: GPA < 2.0, Chuyên cần < 70%"
};

export type StudentsOverviewResult = {
  items: StudentsOverviewRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export class StudentsOverviewRepository {
  private studentRepo: StudentRepository;
  private warningUC: AcademicWarningUseCase;

  constructor(studentRepo = new StudentRepository(), warningUC = new AcademicWarningUseCase()) {
    this.studentRepo = studentRepo;
    this.warningUC = warningUC;
  }

  async getOverview(params?: { semesterId?: number; studentIds?: Array<number | string>; page?: number; pageSize?: number; search?: string; gpaMin?: number; gpaMax?: number }): Promise<StudentsOverviewResult> {
    const semesterId = params?.semesterId;
    const pageRaw = params?.page ?? 1;
    const pageSizeRaw = params?.pageSize ?? 20;
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
    const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? Math.min(Math.floor(pageSizeRaw), 100) : 20;
    const studentIdsFilter = params?.studentIds?.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
    const search = (params?.search || "").trim().toLowerCase();
    const gpaMin = typeof params?.gpaMin === "number" ? params!.gpaMin : undefined;
    const gpaMax = typeof params?.gpaMax === "number" ? params!.gpaMax : undefined;
    const needGpaFilter = gpaMin != null || gpaMax != null;

    const baseList = await this.studentRepo.getListStudent();
    let studentsAll = Array.isArray(studentIdsFilter) && studentIdsFilter.length
      ? baseList.filter((s: any) => studentIdsFilter.includes(Number(s.id)))
      : baseList;
    if (search) {
      studentsAll = studentsAll.filter((s: any) => {
        const code = String(s.student_code || "").toLowerCase();
        const name = String(s.full_name || "").toLowerCase();
        return code.includes(search) || name.includes(search);
      });
    }
    // If GPA filter requested, compute GPA for all candidates and filter before pagination
    let candidates = studentsAll;
    if (needGpaFilter) {
      const filtered: any[] = [];
      for (const st of studentsAll) {
        const sid = Number(st.id);
        const targetSemesterId = typeof semesterId === "number" ? semesterId : await (async () => {
          const { data, error } = await supabase
            .from("enrollment")
            .select("course_offerings:offering_id ( course:course_id ( semester_id ) )")
            .eq("student_id", sid);
          if (error) throw error;
          const ids = (data ?? [])
            .map((r: any) => r.course_offerings?.course?.semester_id)
            .filter((v: any) => typeof v === "number") as number[];
          return ids.length === 0 ? null : Math.max(...ids);
        })();

        let gpa4: number | null = null;
        if (typeof targetSemesterId === "number") {
          const gradesInfo = await this.warningUC.getStudentGrades(sid, targetSemesterId);
          gpa4 = gradesInfo?.gpa4 ?? null;
        }

        const passMin = gpaMin != null ? (gpa4 != null && gpa4 >= gpaMin) : true;
        const passMax = gpaMax != null ? (gpa4 != null && gpa4 <= gpaMax) : true;
        if (passMin && passMax) filtered.push(st);
      }
      candidates = filtered;
    }

    const total = candidates.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const students = candidates.slice(start, end);

    const semesterNameCache = new Map<number, string>();
    const getSemesterName = async (id: number | null | undefined) => {
      if (!id && id !== 0) return null;
      const key = Number(id);
      if (semesterNameCache.has(key)) return semesterNameCache.get(key)!;
      const { data, error } = await supabase.from("semesters").select("name").eq("id", key).maybeSingle();
      if (error) throw error;
      const name = data?.name ?? null;
      if (name) semesterNameCache.set(key, name);
      return name;
    };

    const getLatestSemesterId = async (studentId: number): Promise<number | null> => {
      const { data, error } = await supabase
        .from("enrollment")
        .select("course_offerings:offering_id ( course:course_id ( semester_id ) )")
        .eq("student_id", studentId);
      if (error) throw error;
      const ids = (data ?? [])
        .map((r: any) => r.course_offerings?.course?.semester_id)
        .filter((v: any) => typeof v === "number") as number[];
      if (ids.length === 0) return null;
      return Math.max(...ids);
    };

    const getAttendancePercent = async (studentId: number, semId: number): Promise<number | null> => {
      const { data: enr, error: enrErr } = await supabase
        .from("enrollment")
        .select("id, course_offerings:offering_id ( course:course_id ( semester_id ) )")
        .eq("student_id", studentId)
        .eq("course_offerings.course.semester_id", semId);
      if (enrErr) throw enrErr;
      const enrollmentIds = (enr ?? []).map((e: any) => e.id);
      if (enrollmentIds.length === 0) return null;

      const { data: attRows, error: attErr } = await supabase
        .from("attendance")
        .select("status, enrollment_id")
        .in("enrollment_id", enrollmentIds);
      if (attErr) throw attErr;
      const rows = attRows ?? [];
      if (rows.length === 0) return null;
      let present = 0;
      let total = 0;
      rows.forEach((r: any) => {
        const st = String(r.status || "").toLowerCase();
        if (st === "present") present += 1;
        if (st === "present" || st === "absent") total += 1;
      });
      if (total === 0) return null;
      return Number(((present / total) * 100).toFixed(2));
    };

    // Heuristic to propose a warning level and a short action description
    const buildProposal = (info: { gpa: number | null; failed: number; attendance: number | null; totalWarning: number }): { level: number; action: string } => {
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
      const candidate = Math.max(lvlByGpa, lvlByFailed, lvlByAttend);
      if (candidate === 0) {
        return { level: 0, action: "Không" };
      }
      // If student already has warnings, suggest the next level (capped to 3) if more severe than candidate
      const nextByHistory = Math.min((totalWarning || 0) + 1, 3);
      const proposed = Math.max(candidate, nextByHistory);
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
      const label = proposed === 1 ? "Cảnh cáo 1" : proposed === 2 ? "Cảnh cáo 2" : "Cảnh cáo 3";
      const action = reasons.length ? `Đề xuất ${label}: ${reasons.join(", ")}` : `Đề xuất ${label}`;
      return { level: proposed, action };
    };

  const result: StudentsOverviewRow[] = [];
    for (const st of students) {
      const sid = Number(st.id);
      const targetSemesterId = typeof semesterId === "number" ? semesterId : await getLatestSemesterId(sid);

  let semesterName: string | null = null;
  let semesterIdForRow: number | null = null;
      let gpa4: number | null = null;
      let failedCount = 0;
      let warningsCount = 0;
      let latestWarning: string | null = null;
      let attendancePercent: number | null = null;

      if (typeof targetSemesterId === "number") {
        // GPA + failed subjects from grade_summary via AcademicWarningUseCase.getStudentGrades
        const gradesInfo = await this.warningUC.getStudentGrades(sid, targetSemesterId);
  semesterName = gradesInfo?.semesterName ?? (await getSemesterName(targetSemesterId));
  semesterIdForRow = targetSemesterId;
        gpa4 = gradesInfo?.gpa4 ?? null;
        failedCount = gradesInfo?.summary?.failedSubjects ?? 0;

        // total_warning via AcademicWarningUseCase.getStudentWarnings
        const warnings = await this.warningUC.getStudentWarnings(sid, targetSemesterId);
        warningsCount = warnings?.total_warning ?? 0;
        latestWarning = warnings?.warnings?.[0]?.warned_at ?? null;

        // attendance%
        attendancePercent = await getAttendancePercent(sid, targetSemesterId);
      } else {
        semesterName = null;
        gpa4 = null;
        failedCount = 0;
        // When no semester filter, still return overall warnings summary for the student
        const warningsAll = await this.warningUC.getStudentWarnings(sid);
        warningsCount = warningsAll?.total_warning ?? 0;
        latestWarning = warningsAll?.warnings?.[0]?.warned_at ?? null; // ordered desc in repository
        attendancePercent = null;
        semesterIdForRow = null;
      }

      const proposal = buildProposal({
        gpa: gpa4,
        failed: failedCount,
        attendance: attendancePercent,
        totalWarning: warningsCount,
      });

      result.push({
        student_id: st.id,
        student_code: st.student_code,
        full_name: st.full_name,
        class: st.class_code || st.class_name || "",
        faculty: st.faculty_name || "",
        semester: semesterName,
  semester_id: semesterIdForRow,
        gpa: gpa4,
        failed_subjects: failedCount,
        total_warning: warningsCount,
        academic_status: st.academic_status,
        attendance_rate: attendancePercent,
        latest_warning: latestWarning,
        proposed_warning_level: proposal.level,
        proposed_action: proposal.action,
      });
    }

    return { items: result, total, page, pageSize, totalPages };
  }
}
