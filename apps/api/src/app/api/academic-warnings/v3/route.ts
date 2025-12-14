import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { academicWarningV3UseCase } from "@packages/core/usecases/AcademicWarningV3UseCase";

export async function GET(req: NextRequest) {
  try {
    const headerToken = req.headers.get("authorization");
    if (!headerToken) {
      return NextResponse.json({ returnCode: -1, message: "No token", data: null }, { status: 401 });
    }
    const user = await authenticate(req);
    if (user.role !== "admin" && user.role !== "lecturer") {
      return NextResponse.json({ returnCode: -1, message: "Forbidden", data: null }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const semesterId = searchParams.get("semesterId") || undefined;
    const search = searchParams.get("search") || undefined;
    const classCode = searchParams.get("classCode") || searchParams.get("classroom") || undefined;
    const academicYear = searchParams.get("academicYear") || undefined;
    const onlyProposed = searchParams.get("onlyProposed") || undefined;
    const isWarned = searchParams.get("isWarned") || undefined;
    const page = searchParams.get("page") || undefined;
    const pageSize = searchParams.get("pageSize") || searchParams.get("limit") || undefined;

    const { items, total, page: pg, pageSize: ps } = await academicWarningV3UseCase.list({ 
      semesterId, 
      search, 
      classCode, 
      academicYear,
      onlyProposed,
      isWarned,
      page, 
      pageSize 
    });
    
    const simplified = items.map((it) => ({
      user_id: it.user_id,
      student_id: it.student_id,
      student_code: it.student_code,
      full_name: it.full_name,
      class_code: it.class_code,
      academic_year: it.academic_year,
      semester_name: it.semester_name,
      semester_id: it.semester_id ?? null,
      semester_number: it.semester_number ?? null,
      avg_score_4: it.avg_score_4 ?? null,
      cum_avg_score_4: it.cum_avg_score_4 ?? null,
      total_credit_failed: it.total_credit_failed ?? null,
      total_credit_failed_cumulative: it.total_credit_failed_cumulative ?? null,
      total_credit_registered: it.total_credit_registered ?? null,
      year_of_study: it.year_of_study ?? null,
      
      // Thresholds
      semester_gpa_threshold: it.semester_gpa_threshold ?? null,
      cumulative_gpa_threshold: it.cumulative_gpa_threshold ?? null,
      
      // Violation flags
      failed_over_50: !!it.failed_over_50,
      cumulative_failed_over_24: !!it.cumulative_failed_over_24,
      semester_gpa_below_threshold: !!it.semester_gpa_below_threshold,
      cumulative_gpa_below_threshold: !!it.cumulative_gpa_below_threshold,
      
      // Warning history
      previous_warnings_count: it.previous_warnings_count ?? 0,
      consecutive_warnings_count: it.consecutive_warnings_count ?? 0,
      warnings_count_total: it.warnings_count_total ?? 0,
      
      // Results
      proposed_warning_level: it.proposed_warning_level ?? null,
      violation_reasons: Array.isArray(it.violation_reasons) ? it.violation_reasons : [],
      expulsion_candidate: !!it.expulsion_candidate,
      expulsion_reasons: Array.isArray(it.expulsion_reasons) ? it.expulsion_reasons : [],
      is_warned: !!it.is_warned,
    }));
    
    const res = NextResponse.json({ 
      returnCode: 0, 
      message: "OK", 
      data: simplified, 
      meta: { total, page: pg, pageSize: ps } 
    }, { status: 200 });
    
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "System error";
    const isUnauthorized = message === "No token" || message === "Invalid token" || message === "Token expired";
    const status = isUnauthorized ? 401 : 500;
    const res = NextResponse.json({ returnCode: -1, message, data: null }, { status });
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res;
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

