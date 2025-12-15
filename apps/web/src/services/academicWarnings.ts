"use client";


export type SemesterItem = { id: number; name: string; academic_year: string | null; start_date?: string | null; end_date?: string | null };
export type ClassItem = { id: number; class_code: string };
export type FacultyItem = { id: number; name: string };
export type MajorItem = { id: number; name: string; major_code: string };

export function createAcademicWarningsApi(baseUrl: string) {

  const authHeaders = (): Record<string, string> => {
    let token: string | null = null;
    try {
      if (typeof document !== "undefined") {
        const cookieToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];
        const lsToken = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
        token = cookieToken || lsToken || null;
      }
    } catch {}
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getJson = async (input: RequestInfo, init?: RequestInit) => {
    const res = await fetch(input, init);
    const json = await res.json();
    return json;
  };

  return {
    async fetchSemesters(signal?: AbortSignal): Promise<SemesterItem[]> {
      const headers: HeadersInit = { ...authHeaders() };
      const json = await getJson(`${baseUrl}/api/semesters`, { method: "GET", headers, signal });
      if (json?.returnCode === 0 && Array.isArray(json.data)) return json.data as SemesterItem[];
      return [];
    },
    async fetchClasses(signal?: AbortSignal): Promise<ClassItem[]> {
      const headers: HeadersInit = { ...authHeaders() };
      const json = await getJson(`${baseUrl}/api/classes`, { method: "GET", headers, signal });
      if (json?.returnCode === 0 && Array.isArray(json.data)) {
        return (json.data as Array<{ id?: number | string; class_code?: string }>).
          map((c) => ({ id: Number(c.id), class_code: String(c.class_code || "") }));
      }
      return [];
    },
    async fetchFaculties(signal?: AbortSignal): Promise<FacultyItem[]> {
      const headers: HeadersInit = { ...authHeaders() };
      const json = await getJson(`${baseUrl}/api/faculties`, { method: "GET", headers, signal });
      if (json?.returnCode === 0 && Array.isArray(json.data)) {
        return (json.data as Array<{ id?: number | string; name?: string }>).
          map((f) => ({ id: Number(f.id), name: String(f.name || "") }));
      }
      return [];
    },
    async fetchAllMajors(signal?: AbortSignal): Promise<MajorItem[]> {
      const headers: HeadersInit = { ...authHeaders() };
      const json = await getJson(`${baseUrl}/api/majors`, { method: "GET", headers, signal });
      if (json?.returnCode === 0 && Array.isArray(json.data)) {
        return (json.data as Array<{ id?: number | string; name?: string; major_code?: string }>).
          map((m) => ({ id: Number(m.id), name: String(m.name || ""), major_code: String(m.major_code || "") }));
      }
      return [];
    },
    async fetchClassesByMajor(majorId: number, signal?: AbortSignal): Promise<ClassItem[]> {
      const headers: HeadersInit = { ...authHeaders() };
      const json = await getJson(`${baseUrl}/api/classes/${majorId}`, { method: "GET", headers, signal });
      if (json?.returnCode === 0 && Array.isArray(json.data)) {
        return (json.data as Array<{ id?: number | string; class_code?: string }>).
          map((c) => ({ id: Number(c.id), class_code: String(c.class_code || "") }));
      }
      return [];
    },
    async fetchV3List(params: URLSearchParams, signal?: AbortSignal) {
      const url = `${baseUrl}/api/academic-warnings/v3?${params.toString()}`;
      const headers: HeadersInit = { ...authHeaders() };
      const json = await getJson(url, { method: "GET", headers, signal });
      return json;
    },
    async markWarned(payload: { studentId: number; semesterId: number; level: "FIRST" | "SECOND" | "FINAL" | "EXPULSION" }) {
      const headers: HeadersInit = { "Content-Type": "application/json", ...authHeaders() };
      const json = await getJson(`${baseUrl}/api/academic-warnings/mark-warned`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      return json;
    },
    async fetchStudentWarnings(studentId: number | string, params?: URLSearchParams, signal?: AbortSignal) {
      const suffix = params && params.toString() ? `?${params.toString()}` : "";
      const url = `${baseUrl}/api/students/${studentId}/warnings${suffix}`;
      const headers: HeadersInit = { ...authHeaders() };
      const json = await getJson(url, { method: "GET", headers, signal });
      return json;
    },
  };
}


