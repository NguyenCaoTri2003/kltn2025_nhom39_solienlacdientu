import { supabase } from "@packages/data/supabaseClient";

export type AcademicWarningV2Row = {
  user_id: number;
  student_id: number;
  student_code: string;
  full_name: string;
  class_code: string;
  semester_id: number | null;
  semester_name: string | null;
  academic_year: string | null;
  avg_score_10?: number | null;
  avg_score_4?: number | null;
  cum_avg_score_10?: number | null;
  cum_avg_score_4: number | null;
  total_credit_failed: number | null;
  semester_classification?: string | null;
  cumulative_classification: string | null;
  // Added fields for richer warning logic
  total_credit_accumulated: number | null;
  total_credit_registered: number | null;
  academic_status: string | null;
  year_of_study: number | null;
  gpa_threshold: number | null;
  under_threshold: boolean; // boolean, never null
  previous_warnings_count: number; // computed per student for current page
  // Derived flags & summaries for warning logic
  failed_over_50: boolean; // boolean, never null
  total_credit_failed_cumulative: number | null;
  violation_reasons: string[]; // human-readable reasons
  proposed_warning_level: "FIRST" | "SECOND" | "FINAL" | null;
  expulsion_candidate: boolean; // boolean, never null
  warnings_count_total?: number; // optional: total warnings regardless of level
};

export type AcademicWarningV2Result = {
  items: AcademicWarningV2Row[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export class AcademicWarningV2Repository {
  async list(params: {
    semesterId?: number;
    search?: string;
    classCode?: string;
    academicYear?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AcademicWarningV2Result> {
    const page = Math.max(1, Math.floor(params.page ?? 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Math.floor(params.pageSize ?? 20))
    );
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Optional pre-filters to compute candidate ids
    const filters: { studentIds?: number[]; semesterIds?: number[] } = {};

    // Search by student_code or full_name
    const client = supabase;
    const q = (params.search || "").trim();
    if (q) {
      const { data: stu, error: stuErr } = await client
        .from("students")
        .select(
          `id, student_code, users ( id, full_name ), classes:class_id ( class_code )`
        )
        .or(`student_code.ilike.%${q}%,users.full_name.ilike.%${q}%`);
      if (stuErr) throw stuErr;
      const ids = (stu ?? [])
        .map((s: any) => Number(s.id))
        .filter((n) => Number.isFinite(n));
      if (ids.length === 0) {
        return { items: [], total: 0, page, pageSize, totalPages: 0 };
      }
      filters.studentIds = ids;
    }

    // Filter by class code
    if (params.classCode && params.classCode !== "all") {
      const { data: cls, error: clsErr } = await client
        .from("students")
        .select(`id, classes:class_id ( class_code )`)
        .eq("classes.class_code", params.classCode);
      if (clsErr) throw clsErr;
      const ids = (cls ?? [])
        .map((s: any) => Number(s.id))
        .filter((n) => Number.isFinite(n));
      if (filters.studentIds) {
        // intersect
        const set = new Set(filters.studentIds);
        filters.studentIds = ids.filter((id) => set.has(id));
      } else {
        filters.studentIds = ids;
      }
      if (!filters.studentIds || filters.studentIds.length === 0) {
        return { items: [], total: 0, page, pageSize, totalPages: 0 };
      }
    }

    // Filter by academic year on semesters
    if (params.academicYear) {
      const { data: sems, error: semErr } = await client
        .from("semesters")
        .select("id, academic_year")
        .eq("academic_year", params.academicYear);
      if (semErr) throw semErr;
      const sids = (sems ?? [])
        .map((s: any) => Number(s.id))
        .filter((n) => Number.isFinite(n));
      if (sids.length === 0) {
        return { items: [], total: 0, page, pageSize, totalPages: 0 };
      }
      filters.semesterIds = sids;
    }

    // Core query from semester_summary
    let query = client
      .from("semester_summary")
      .select(
        `
        student_id,
        semester_id,
        avg_score_10,
        avg_score_4,
        cum_avg_score_4,
        cum_avg_score_10,
        total_credit_failed,
        total_credit_accumulated,
        total_credit_registered,
        semester_classification,
        cumulative_classification,
        students:student_id (
          id,
          student_code,
          academic_status,
          academic_year,
          users ( id, full_name ),
          classes:class_id ( id, class_code, name )
        ),
        semesters:semester_id ( id, name, academic_year )
      `,
        { count: "exact" }
      )
      .order("semester_id", { ascending: false })
      .order("student_id", { ascending: true });

    if (params.semesterId != null) {
      query = query.eq("semester_id", params.semesterId);
    }
    if (filters.studentIds && filters.studentIds.length > 0) {
      query = query.in("student_id", filters.studentIds);
    }
    if (
      filters.semesterIds &&
      filters.semesterIds.length > 0 &&
      params.semesterId == null
    ) {
      query = query.in("semester_id", filters.semesterIds);
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    /*
    studentAY là academic_year của sinh viên (ví dụ "2022-2023" — tức là sinh viên nhập học năm 2022).
    semesterAY là academic_year của học kỳ hiện tại (ví dụ "2024-2025").
    parseStartYear() chỉ lấy ra 4 số đầu tiên trong academic_year: "2022-2023" → 2022.
    computeYearOfStudy() lấy hiệu giữa semesterAY và studentAY, rồi cộng thêm 1.
    2024 - 2022 = 2 → 2 + 1 = 3
    → Năm học thứ 3.
    */
    const parseStartYear = (ay?: string | null): number | null => {
      if (!ay) return null;
      const m = /^(\d{4})/.exec(ay);
      return m ? Number(m[1]) : null;
    };
    const computeYearOfStudy = (
      studentAY?: string | null,
      semesterAY?: string | null
    ): number | null => {
      const s = parseStartYear(studentAY);
      const c = parseStartYear(semesterAY);
      if (s == null || c == null) return null;
      const diff = c - s;
      return diff >= 0 ? diff + 1 : null;
    };
    const thresholdByYear = (year?: number | null): number | null => {
      if (!year) return null;
      if (year <= 1) return 1.2;
      if (year === 2) return 1.4;
      if (year === 3) return 1.6;
      return 1.8; // year 4+
    };

    let items: AcademicWarningV2Row[] = (data ?? []).map((row: any) => {
      const semesterAY: string | null = row.semesters?.academic_year ?? null;
      const studentAY: string | null = row.students?.academic_year ?? null;
      const yearOfStudy = computeYearOfStudy(studentAY, semesterAY);
      // Parse raw scores
      let avg4 =
        typeof row.avg_score_4 === "number"
          ? row.avg_score_4
          : row.avg_score_4 != null
          ? Number(row.avg_score_4)
          : null;
      let avg10 =
        typeof row.avg_score_10 === "number"
          ? row.avg_score_10
          : row.avg_score_10 != null
          ? Number(row.avg_score_10)
          : null;
      let cum4 =
        typeof row.cum_avg_score_4 === "number"
          ? row.cum_avg_score_4
          : row.cum_avg_score_4 != null
          ? Number(row.cum_avg_score_4)
          : null;
      let cum10 =
        typeof row.cum_avg_score_10 === "number"
          ? row.cum_avg_score_10
          : row.cum_avg_score_10 != null
          ? Number(row.cum_avg_score_10)
          : null;

      // Sync 10 <-> 4 scales if only one is available
      if (avg4 == null && avg10 != null) avg4 = Number((avg10 / 2.5).toFixed(2));
      if (avg10 == null && avg4 != null) avg10 = Number((avg4 * 2.5).toFixed(2));
      if (cum4 == null && cum10 != null) cum4 = Number((cum10 / 2.5).toFixed(2));
      if (cum10 == null && cum4 != null) cum10 = Number((cum4 * 2.5).toFixed(2));

      const threshold = thresholdByYear(yearOfStudy);
      const avgBelow = threshold != null && avg4 != null ? avg4 < threshold : false;
      const cumBelow = threshold != null && cum4 != null ? cum4 < threshold : false;
      const underThreshold = avgBelow || cumBelow; // boolean only

      const reg =
        typeof row.total_credit_registered === "number"
          ? row.total_credit_registered
          : row.total_credit_registered != null
          ? Number(row.total_credit_registered)
          : null;
      const failed =
        typeof row.total_credit_failed === "number"
          ? row.total_credit_failed
          : row.total_credit_failed != null
          ? Number(row.total_credit_failed)
          : null;
  const failedOver50 = reg != null && reg > 0 && failed != null ? failed > reg * 0.5 : false;

      // total accumulated credits normalization
      const accumulated =
        typeof row.total_credit_accumulated === "number"
          ? row.total_credit_accumulated
          : row.total_credit_accumulated != null
          ? Number(row.total_credit_accumulated)
          : null;

      return {
        user_id: Number(row.students?.users?.id),
        student_id: Number(row.student_id),
        student_code: String(row.students?.student_code || ""),
        full_name: String(row.students?.users?.full_name || ""),
        class_code: String(row.students?.classes?.class_code || ""),
        semester_id: row.semester_id ?? row.semesters?.id ?? null,
        semester_name: row.semesters?.name ?? null,
        academic_year: semesterAY,
        avg_score_10: avg10,
        avg_score_4: avg4,
        cum_avg_score_4: cum4,
        cum_avg_score_10: cum10,
        total_credit_failed: failed,
        semester_classification: row.semester_classification ?? null,
        cumulative_classification: row.cumulative_classification ?? null,
        total_credit_accumulated: accumulated,
        total_credit_registered: reg,
        academic_status: row.students?.academic_status ?? null,
        year_of_study: yearOfStudy,
        gpa_threshold: threshold,
        under_threshold: underThreshold,
        previous_warnings_count: 0, // will be filled below
        failed_over_50: failedOver50,
        total_credit_failed_cumulative: null, // to be filled below when semesterId provided
        violation_reasons: [],
        proposed_warning_level: null,
        expulsion_candidate: false,
      };
    });

    // Compute previous warnings count for current page's students (single extra query)
    const studentIds = Array.from(new Set(items.map((i) => i.student_id))).filter((n) => Number.isFinite(n));
    const userIds = Array.from(new Set(items.map((i) => i.user_id))).filter((n) => Number.isFinite(n));
    if (userIds.length > 0) {
      // Count all warnings (any level)
      const { data: warnsAll, error: warnsAllErr } = await client
        .from("academic_warnings")
        .select("student_id, level")
        .in("student_id", userIds as number[]);
      if (!warnsAllErr && Array.isArray(warnsAll)) {
        const totalCounts = new Map<number, number>(); // keyed by user_id
        const levelCounts = new Map<number, number>(); // keyed by user_id
        for (const w of warnsAll as any[]) {
          const sid = Number(w.student_id);
          if (!Number.isFinite(sid)) continue;
          totalCounts.set(sid, (totalCounts.get(sid) ?? 0) + 1);
          // Only count FIRST/SECOND/FINAL for previous_warnings_count
          if (w.level === "FIRST" || w.level === "SECOND" || w.level === "FINAL") {
            levelCounts.set(sid, (levelCounts.get(sid) ?? 0) + 1);
          }
        }
        items = items.map((it) => ({
          ...it,
          previous_warnings_count: levelCounts.get(it.user_id) ?? 0,
          warnings_count_total: totalCounts.get(it.user_id) ?? 0,
        }));
      }
    }

    // Compute cumulative failed credits up to selected semester (if semesterId provided)
    if (params.semesterId && studentIds.length > 0) {
      const { data: cum, error: cumErr } = await client
        .from("semester_summary")
        .select("student_id, total_credit_failed, semester_id")
        .in("student_id", studentIds as number[])
        .lte("semester_id", params.semesterId);
      if (!cumErr && Array.isArray(cum)) {
        const sums = new Map<number, number>();
        for (const r of cum as any[]) {
          const sid = Number(r.student_id);
          const val = r.total_credit_failed != null ? Number(r.total_credit_failed) : 0;
          if (!Number.isFinite(sid) || !Number.isFinite(val)) continue;
          sums.set(sid, (sums.get(sid) ?? 0) + val);
        }
        items = items.map((it) => ({
          ...it,
          total_credit_failed_cumulative: sums.get(it.student_id) ?? it.total_credit_failed_cumulative,
        }));
      }
    }

    // Finalize violations and proposed level/expulsion flags
    items = items.map((it) => {
      const cond1 = it.failed_over_50 === true;
      const cond2 = it.total_credit_failed_cumulative != null ? it.total_credit_failed_cumulative > 24 : false;
      const cond3 = it.under_threshold === true;
      const reasons: string[] = [];
      if (cond1) {
        const failed = it.total_credit_failed ?? 0;
        const reg = it.total_credit_registered ?? 0;
        reasons.push(`Rớt quá 50% tín chỉ (${failed}/${reg})`);
      }
      if (cond2) {
        reasons.push(`Nợ đọng tín chỉ > 24 (${it.total_credit_failed_cumulative})`);
      }
      if (cond3) {
        const thr = it.gpa_threshold ?? 0;
        const a4 = it.avg_score_4 ?? null;
        const c4 = it.cum_avg_score_4 ?? null;
        if (a4 != null && a4 < thr) {
          reasons.push(`GPA học kỳ dưới ngưỡng ${thr} (${a4} < ${thr})`);
        }
        if (c4 != null && c4 < thr) {
          reasons.push(`GPA tích lũy dưới ngưỡng ${thr} (${c4} < ${thr})`);
        }
      }

      let level: AcademicWarningV2Row["proposed_warning_level"] = null;
      if (cond1 || cond2 || cond3) {
        if (it.previous_warnings_count >= 2) level = "FINAL";
        else if (it.previous_warnings_count === 1) level = "SECOND";
        else level = "FIRST";
      }

      const expulsionCandidate = it.previous_warnings_count >= 2 && (cond1 || cond2 || cond3);
      return { ...it, violation_reasons: reasons, proposed_warning_level: level, expulsion_candidate: expulsionCandidate };
    });

    const total = count || 0;
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }
}
