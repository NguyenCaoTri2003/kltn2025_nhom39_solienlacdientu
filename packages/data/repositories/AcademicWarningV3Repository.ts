import { supabase } from "@packages/data/supabaseClient";

export type AcademicWarningV3Row = {
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

  total_credit_accumulated: number | null;
  total_credit_registered: number | null;
  academic_status: string | null;
  year_of_study: number | null;
  semester_number: number | null; // Số thứ tự học kỳ (1, 2, 3, ...)
  
  semester_gpa_threshold: number | null; // 0.80 cho học kỳ đầu, 1.00 cho các học kỳ sau
  cumulative_gpa_threshold: number | null; // Theo năm học: 1.20, 1.40, 1.60, 1.80

  semester_gpa_below_threshold: boolean;
  cumulative_gpa_below_threshold: boolean;
  failed_over_50: boolean;
  cumulative_failed_over_24: boolean;
  
  previous_warnings_count: number;
  consecutive_warnings_count: number; // Số cảnh báo liên tiếp
  
  total_credit_failed_cumulative: number | null;

  violation_reasons: string[];
  proposed_warning_level: "FIRST" | "SECOND" | "FINAL" | "EXPULSION" | null;
  
  expulsion_candidate: boolean;
  expulsion_reasons: string[];
  
  warnings_count_total?: number;
  is_warned: boolean;
};

export type AcademicWarningV3Result = {
  items: AcademicWarningV3Row[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export class AcademicWarningV3Repository {
  async list(params: {
    semesterId?: number;
    search?: string;
    classCode?: string;
    academicYear?: string;
    onlyProposed?: boolean; // Chỉ lấy sinh viên có đề xuất cảnh cáo hoặc thôi học
    isWarned?: boolean; // Filter theo trạng thái đã cảnh cáo: true = đã cảnh cáo, false = chưa cảnh cáo
    page?: number;
    pageSize?: number;
  }): Promise<AcademicWarningV3Result> {
    const page = Math.max(1, Math.floor(params.page ?? 1));
    const pageSize = Math.min(
      100,
      Math.max(1, Math.floor(params.pageSize ?? 20))
    );
    // Khi onlyProposed = true, cần query tất cả rồi filter, nên không paginate ở query level
    const shouldPaginateAtQuery = params.onlyProposed !== true;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const filters: { studentIds?: number[]; semesterIds?: number[] } = {};

    const client = supabase;
    const q = (params.search || "").trim();
    if (q) {
      const pattern = `%${q}%`;
      const [byCode, byName] = await Promise.all([
        client
          .from("students")
          .select(`id, student_code`)
          .ilike("student_code", pattern),
        client
          .from("students")
          .select(`id, users!inner ( id, full_name )`)
          .ilike("users.full_name", pattern),
      ]);
      if (byCode.error) throw byCode.error;
      if (byName.error) throw byName.error;
      const ids = [
        ...((byCode.data ?? []) as any[]).map((s) => Number(s.id)),
        ...((byName.data ?? []) as any[]).map((s) => Number(s.id)),
      ].filter((n) => Number.isFinite(n));
      const uniq = Array.from(new Set(ids));
      if (uniq.length === 0) {
        return { items: [], total: 0, page, pageSize, totalPages: 0 };
      }
      filters.studentIds = uniq;
    }

    if (params.classCode && params.classCode !== "all") {
      const { data: classData, error: classErr } = await client
        .from("classes")
        .select("id")
        .eq("class_code", params.classCode)
        .single();
      if (classErr) throw classErr;
      if (!classData) {
        return { items: [], total: 0, page, pageSize, totalPages: 0 };
      }
      const classId = Number(classData.id);
      if (!Number.isFinite(classId)) {
        return { items: [], total: 0, page, pageSize, totalPages: 0 };
      }
      const { data: studentsData, error: studentsErr } = await client
        .from("students")
        .select("id")
        .eq("class_id", classId);
      if (studentsErr) throw studentsErr;
      const ids = (studentsData ?? [])
        .map((s: any) => Number(s.id))
        .filter((n) => Number.isFinite(n));
      if (filters.studentIds) {
  
        const set = new Set(filters.studentIds);
        filters.studentIds = ids.filter((id) => set.has(id));
      } else {
        filters.studentIds = ids;
      }
      if (!filters.studentIds || filters.studentIds.length === 0) {
        return { items: [], total: 0, page, pageSize, totalPages: 0 };
      }
    }

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
          )
        ),
        semesters:semester_id ( id, name, academic_year, start_date )
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

    
    const { data, error, count } = shouldPaginateAtQuery 
      ? await query.range(from, to)
      : await query;
    if (error) throw error;

    // Helper functions
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

    const cumulativeGpaThresholdByYear = (year?: number | null): number | null => {
      if (!year) return null;
      if (year <= 1) return 1.2;
      if (year === 2) return 1.4;
      if (year === 3) return 1.6;
      return 1.8; // year 4+
    };


    const semesterGpaThreshold = (semesterNumber: number | null): number | null => {
      if (semesterNumber == null) return null;
      return semesterNumber === 1 ? 0.8 : 1.0;
    };

    const studentSemesterMap = new Map<number, Map<number, number>>();
    if (data && data.length > 0) {
      const allStudentIds = Array.from(new Set((data as any[]).map((r: any) => Number(r.student_id))));
      
      if (allStudentIds.length > 0) {

        const { data: allSemData } = await client
          .from("semester_summary")
          .select("student_id, semester_id, semesters!inner(id, start_date)")
          .in("student_id", allStudentIds)
          .order("student_id", { ascending: true })
          .order("semesters.start_date", { ascending: true });
        
        if (allSemData && Array.isArray(allSemData)) {

          const studentSemGroups = new Map<number, Array<{ semester_id: number; start_date: string | null }>>();
          
          for (const item of allSemData as any[]) {
            const studentId = Number(item.student_id);
            if (!Number.isFinite(studentId)) continue;
            
            if (!studentSemGroups.has(studentId)) {
              studentSemGroups.set(studentId, []);
            }
            
            studentSemGroups.get(studentId)!.push({
              semester_id: Number(item.semester_id),
              start_date: item.semesters?.start_date ?? null,
            });
          }
          

          Array.from(studentSemGroups.entries()).forEach(([studentId, semesters]) => {
            semesters.sort((a, b) => {
              if (!a.start_date || !b.start_date) return 0;
              return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
            });
            
            const semMap = new Map<number, number>();
            semesters.forEach((sem, index) => {
              semMap.set(sem.semester_id, index + 1); 
            });
            studentSemesterMap.set(studentId, semMap);
          });
        }
      }
    }

    let items: AcademicWarningV3Row[] = (data ?? []).map((row: any) => {
      const semesterAY: string | null = row.semesters?.academic_year ?? null;
      const studentAY: string | null = row.students?.academic_year ?? null;
      const yearOfStudy = computeYearOfStudy(studentAY, semesterAY);
      const semesterId = row.semester_id ? Number(row.semester_id) : null;
      const semesterNumber = semesterId ? studentSemesterMap.get(Number(row.student_id))?.get(semesterId) ?? null : null;

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

      // Đồng bộ GPA 10 <-> 4 nếu chỉ có một trong hai
      if (avg4 == null && avg10 != null) avg4 = Number((avg10 / 2.5).toFixed(2));
      if (avg10 == null && avg4 != null) avg10 = Number((avg4 * 2.5).toFixed(2));
      if (cum4 == null && cum10 != null) cum4 = Number((cum10 / 2.5).toFixed(2));
      if (cum10 == null && cum4 != null) cum10 = Number((cum4 * 2.5).toFixed(2));

      // Thresholds
      const semThreshold = semesterGpaThreshold(semesterNumber);
      const cumThreshold = cumulativeGpaThresholdByYear(yearOfStudy);

      // Check violations
      const semesterGpaBelow = semThreshold != null && avg4 != null ? avg4 < semThreshold : false;
      const cumulativeGpaBelow = cumThreshold != null && cum4 != null ? cum4 < cumThreshold : false;

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
        semester_id: semesterId,
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
        semester_number: semesterNumber,
        semester_gpa_threshold: semThreshold,
        cumulative_gpa_threshold: cumThreshold,
        semester_gpa_below_threshold: semesterGpaBelow,
        cumulative_gpa_below_threshold: cumulativeGpaBelow,
        failed_over_50: failedOver50,
        cumulative_failed_over_24: false, 
        previous_warnings_count: 0, 
        consecutive_warnings_count: 0, 
        total_credit_failed_cumulative: null, 
        violation_reasons: [],
        proposed_warning_level: null,
        expulsion_candidate: false,
        expulsion_reasons: [],
        is_warned: false,
      };
    });


    const studentIds = Array.from(new Set(items.map((i) => i.student_id))).filter((n) => Number.isFinite(n));
    const userIds = Array.from(new Set(items.map((i) => i.user_id))).filter((n) => Number.isFinite(n));
    
    if (userIds.length > 0) {
      const { data: warnsAll, error: warnsAllErr } = await client
        .from("academic_warnings")
        .select("student_id, level, semester_id, warned_at")
        .in("student_id", userIds as number[])
        .order("warned_at", { ascending: false });
      
      if (!warnsAllErr && Array.isArray(warnsAll)) {
        const totalCounts = new Map<number, number>();
        const warningLevels = new Map<number, Array<{ level: string; semester_id: number | null }>>();
        // Map để check is_warned: key = "student_id:semester_id", value = true/false
        const warnedMap = new Map<string, boolean>();
        
        for (const w of warnsAll as any[]) {
          const sid = Number(w.student_id);
          if (!Number.isFinite(sid)) continue;
          totalCounts.set(sid, (totalCounts.get(sid) ?? 0) + 1);
          
          // Đánh dấu đã cảnh cáo cho cặp student_id + semester_id
          const semId = w.semester_id ? Number(w.semester_id) : null;
          if (semId != null) {
            const key = `${sid}:${semId}`;
            warnedMap.set(key, true);
          }
          
          if (!warningLevels.has(sid)) {
            warningLevels.set(sid, []);
          }
          warningLevels.get(sid)!.push({
            level: w.level,
            semester_id: w.semester_id ? Number(w.semester_id) : null,
          });
        }

        const consecutiveCounts = new Map<number, number>();
        Array.from(warningLevels.entries()).forEach(([sid, warnings]) => {
          let consecutive = 0;
          if (warnings.length >= 2) {
            const lastTwo = warnings.slice(0, 2);
            const levelOrder = { FIRST: 1, SECOND: 2, FINAL: 3, EXPULSION: 4 };
            const lastLevel = levelOrder[lastTwo[0].level as keyof typeof levelOrder] ?? 0;
            const prevLevel = levelOrder[lastTwo[1].level as keyof typeof levelOrder] ?? 0;
            if (lastLevel >= prevLevel) {
              consecutive = 2;
            }
          }
          consecutiveCounts.set(sid, consecutive);
        });

        items = items.map((it) => {
          const userId = it.user_id;
          const semesterId = it.semester_id;
          // Check is_warned: nếu có record trong academic_warnings với cặp student_id + semester_id
          const warnedKey = semesterId != null ? `${userId}:${semesterId}` : null;
          const isWarned = warnedKey != null ? (warnedMap.get(warnedKey) ?? false) : false;
          
          return {
            ...it,
            previous_warnings_count: totalCounts.get(userId) ?? 0,
            consecutive_warnings_count: consecutiveCounts.get(userId) ?? 0,
            warnings_count_total: totalCounts.get(userId) ?? 0,
            is_warned: isWarned,
          };
        });
      }
    }

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
          cumulative_failed_over_24: (sums.get(it.student_id) ?? 0) > 24,
        }));
      }
    }

    items = items.map((it) => {
      const reasons: string[] = [];
      const expulsionReasons: string[] = [];

      // I. TIÊU CHÍ CẢNH BÁO KẾT QUẢ HỌC TẬP
      
      // a) Về số tín chỉ không đạt
      if (it.failed_over_50) {
        const failed = it.total_credit_failed ?? 0;
        const reg = it.total_credit_registered ?? 0;
        reasons.push(`Tổng số tín chỉ không đạt trong học kỳ vượt quá 50% khối lượng đã đăng ký (${failed}/${reg})`);
      }
      
      if (it.cumulative_failed_over_24) {
        reasons.push(`Tổng số tín chỉ không đạt từ đầu khóa vượt quá 24 tín chỉ (${it.total_credit_failed_cumulative})`);
      }

      // b) Về điểm trung bình học kỳ (ĐTBHL)
      if (it.semester_gpa_below_threshold) {
        const threshold = it.semester_gpa_threshold ?? 0;
        const gpa = it.avg_score_4 ?? 0;
        const semNum = it.semester_number === 1 ? "đầu tiên" : "tiếp theo";
        reasons.push(`ĐTBHL dưới ${threshold} với học kỳ ${semNum} (${gpa} < ${threshold})`);
      }

      // c) Về điểm trung bình tích lũy (ĐTBHTL) theo năm học
      if (it.cumulative_gpa_below_threshold) {
        const threshold = it.cumulative_gpa_threshold ?? 0;
        const gpa = it.cum_avg_score_4 ?? 0;
        const yearText = it.year_of_study === 1 ? "năm nhất" : 
                        it.year_of_study === 2 ? "năm hai" :
                        it.year_of_study === 3 ? "năm ba" : "năm tiếp theo/cuối khóa";
        reasons.push(`ĐTBHTL dưới ${threshold} với sinh viên ${yearText} (${gpa} < ${threshold})`);
      }

      let level: AcademicWarningV3Row["proposed_warning_level"] = null;
      const hasViolation = it.failed_over_50 || 
                          it.cumulative_failed_over_24 || 
                          it.semester_gpa_below_threshold || 
                          it.cumulative_gpa_below_threshold;
      
      if (hasViolation) {
        // Nếu có nguy cơ buộc thôi học, đề xuất EXPULSION
        if (it.expulsion_candidate || it.consecutive_warnings_count >= 2) {
          level = "EXPULSION";
        } else if (it.previous_warnings_count >= 2) {
          level = "FINAL";
        } else if (it.previous_warnings_count === 1) {
          level = "SECOND";
        } else {
          level = "FIRST";
        }
      }

      // II. TIÊU CHÍ BUỘC THÔI HỌC
      // Bị cảnh báo học tập 2 lần liên tiếp của một khóa học
      if (it.consecutive_warnings_count >= 2) {
        expulsionReasons.push("Bị cảnh báo học tập 2 lần liên tiếp của một khóa học");
      }


      const isExpulsionCandidate = expulsionReasons.length > 0;

      return {
        ...it,
        violation_reasons: reasons,
        proposed_warning_level: level,
        expulsion_candidate: isExpulsionCandidate,
        expulsion_reasons: expulsionReasons,
      };
    });

    // Filter theo is_warned nếu có
    if (params.isWarned !== undefined) {
      items = items.filter((it) => it.is_warned === params.isWarned);
    }

    if (params.onlyProposed === true) {
      items = items.filter((it) => it.proposed_warning_level != null || it.expulsion_candidate === true);
      const filteredTotal = items.length;
      const paginatedItems = items.slice(from, to + 1);
      return {
        items: paginatedItems,
        total: filteredTotal,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(filteredTotal / pageSize)),
      };
    }

    const total = shouldPaginateAtQuery ? (count || 0) : items.length;
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async createWarning(input: {
    studentId: number;
    semesterId: number;
    level: "FIRST" | "SECOND" | "FINAL" | string;
    reason: string;
    createdBy?: number;
    cumulativeGpa?: number | null;
    debtCredits?: number | null;
    progressStatus?: string | null;
    note?: string | null;
  }) {
    const { data: warning, error: warnErr } = await supabase
      .from("academic_warnings")
      .insert({
        student_id: input.studentId,
        semester_id: input.semesterId,
        level: input.level,
        reason: input.reason,
        created_by: input.createdBy ?? null,
        cumulative_gpa: input.cumulativeGpa ?? null,
        debt_credits: input.debtCredits ?? null,
        progress_status: input.progressStatus ?? null,
        note: input.note ?? null,
      })
      .select("id, student_id, semester_id, level, reason, warned_at")
      .single();
    if (warnErr) throw warnErr;

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

  async getStudentWarnings(studentId: number, semesterId?: number) {
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

  /**
   * Đánh dấu student đã được cảnh cáo cho semester cụ thể
   * Note: Method này chỉ để tương thích với API cũ, thực tế việc đánh dấu được thực hiện qua createWarning
   */
  async markStudentAsWarned(studentId: number, semesterId: number, level: string): Promise<void> {
    // Thực tế việc đánh dấu đã được thực hiện khi tạo warning trong bảng academic_warnings
    // Method này chỉ để tương thích với API cũ
    console.log(`Marking student ${studentId} as warned for semester ${semesterId} with level ${level}`);
  }

  /**
   * Kiểm tra xem student đã được cảnh cáo cho semester chưa
   */
  async isStudentWarned(studentId: number, semesterId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from("academic_warnings")
      .select("id")
      .eq("student_id", studentId)
      .eq("semester_id", semesterId)
      .limit(1);

    if (error) throw error;
    return (data && data.length > 0);
  }

  async getTotalCount(): Promise<number> {
    const { count, error } = await supabase
      .from("academic_warnings")
      .select("id", { count: "exact", head: true });

    if (error) throw error;
    return count || 0;
  }
}

