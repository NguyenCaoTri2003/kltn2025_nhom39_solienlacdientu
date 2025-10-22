import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { getStudentsOverview } from "@packages/core/usecases/StudentsOverviewUseCase";

export async function GET(req: NextRequest) {
	const start = Date.now();
	try {
		const headerToken = req.headers.get("authorization");
		const cookieToken = req.cookies.get("token")?.value;
		if (!headerToken && !cookieToken) {
			return NextResponse.json({ returnCode: -1, message: "No token", data: null }, { status: 401 });
		}

		const user = authenticate(req);
		if (user.role !== "admin" && user.role !== "lecturer") {
			return NextResponse.json({ returnCode: -1, message: "Forbidden", data: null }, { status: 403 });
		}

		const { searchParams } = new URL(req.url);
			const semesterIdParam = searchParams.get("semesterId");
		const studentIdParam = searchParams.get("studentId");
			const pageParam = searchParams.get("page");
			const pageSizeParam = searchParams.get("pageSize") || searchParams.get("limit");
			const gpaMinParam = searchParams.get("gpaMin") || searchParams.get("gpa_min");
			const gpaMaxParam = searchParams.get("gpaMax") || searchParams.get("gpa_max");
			const search = searchParams.get("search") || undefined;
			const facultyName = searchParams.get("faculty") || undefined;
			const classCode = searchParams.get("classCode") || searchParams.get("classroom") || undefined;
			const academicStatus = searchParams.get("academicStatus") || undefined;
			const failedMaxParam = searchParams.get("failedMax") || undefined;
			const attendanceMinParam = searchParams.get("attendanceMin") || undefined;
			const warningFilter = searchParams.get("warningFilter") || undefined;
		const semesterId = semesterIdParam ? Number(semesterIdParam) : undefined;
		const studentIds = studentIdParam
			? studentIdParam.split(",").map((s) => s.trim()).filter(Boolean)
			: undefined;
			const page = pageParam ? Number(pageParam) : undefined;
			const pageSize = pageSizeParam ? Number(pageSizeParam) : undefined;
			const gpaMin = gpaMinParam != null ? Number(gpaMinParam) : undefined;
			const gpaMax = gpaMaxParam != null ? Number(gpaMaxParam) : undefined;
			const failedMax = failedMaxParam != null ? Number(failedMaxParam) : undefined;
			const attendanceMin = attendanceMinParam != null ? Number(attendanceMinParam) : undefined;

			const { items, total, totalPages, page: pg, pageSize: ps } = await getStudentsOverview({ semesterId, studentIds, page, pageSize, search, gpaMin, gpaMax, facultyName, classCode, academicStatus, failedMax, attendanceMin, warningFilter });
				const duration = Date.now() - start;
				const res = NextResponse.json({ returnCode: 0, message: "OK", data: items, meta: { total, totalPages, page: pg, pageSize: ps, executionTime: `${duration}ms` } }, { status: 200 });
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
