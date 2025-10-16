"use client";

import { useEffect, useMemo, useState } from "react";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { RowActionsLearningDataOverview } from "@/components/admin/modals_UI/RowActions_LearningDataOverview";
import Pagination from "@/components/pagination";

type EvalRow = {
  studentId: number;
  studentCode: string;
  fullName: string;
  className: string | null;
  facultyName: string | null;
  semesterId: number;
  semesterName?: string | null;
  gpa4: number | null;
  failedSubjects: number;
  warningsCount: number;
  lastWarningAt: string | null;
  academicStatus: string;
  attendanceRate: number | null;
  status: string;
};

export default function LearningDataOverview() {
  // Filters
  const [searchText, setSearchText] = useState("");
  const [faculty, setFaculty] = useState<string>("");
  const [classroom, setClassroom] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [academicStatus, setAcademicStatus] = useState<string>("");
  const [accountStatus, setAccountStatus] = useState<string>("");
  const [gpaRange, setGpaRange] = useState<string>("");
  const [warningFilter, setWarningFilter] = useState<string>("");

  // Options
  const [faculties, setFaculties] = useState<Array<{ id: number; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([]);
  const [semesters, setSemesters] = useState<Array<{ id: number; name: string }>>([]);

  // Data
  const [rows, setRows] = useState<EvalRow[]>([]);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  // Load options
  useEffect(() => {
    let ignore = false;
    async function loadOptions() {
      try {
        const [facRes, classRes, semRes] = await Promise.all([
          fetch(`${API_BASE}/api/faculties`, { credentials: "include" }),
          fetch(`${API_BASE}/api/classes`, { credentials: "include" }),
          fetch(`${API_BASE}/api/semesters`, { credentials: "include" }),
        ]);
        const [facJson, classJson, semJson] = await Promise.all([
          facRes.json().catch(() => ({})),
          classRes.json().catch(() => ({})),
          semRes.json().catch(() => ({})),
        ]);
        if (!ignore) {
          type ListResponse<T> = { data?: T[] };
          // Faculties
          if (facRes.ok) {
            const { data = [] } = facJson as ListResponse<{ id: number; name: string }>;
            if (Array.isArray(data)) setFaculties(data.map((f) => ({ id: f.id, name: f.name })));
          }
          // Classes
          if (classRes.ok) {
            const { data = [] } = classJson as ListResponse<{ id: number; class_code?: string; name?: string }>;
            if (Array.isArray(data)) setClasses(
              data
                .map((c) => ({ id: c.id, name: c.class_code ?? c.name ?? "" }))
                .filter((c): c is { id: number; name: string } => Boolean(c.name))
            );
          }
          // Semesters
          if (semRes.ok) {
            const { data = [] } = semJson as ListResponse<{ id: number; name: string }>;
            if (Array.isArray(data)) setSemesters(data.map((s) => ({ id: s.id, name: s.name })));
          }
        }
      } catch {
        // ignore
      }
    }
    loadOptions();
    return () => { ignore = true; };
  }, [API_BASE]);

  const mapGpaRange = useMemo(() => {
    switch (gpaRange) {
      case "4":
        return { gpaMin: 4.0, gpaMax: 4.0 };
      case "3":
        return { gpaMin: 3.0, gpaMax: 3.9 };
      case "2":
        return { gpaMin: 2.0, gpaMax: 2.9 };
      case "1":
        return { gpaMin: 0, gpaMax: 1.99 };
      default:
        return {} as { gpaMin?: number; gpaMax?: number };
    }
  }, [gpaRange]);

  const warningCountFromFilter = useMemo(() => {
    switch (warningFilter) {
      case "none":
        return 0;
      case "warning_1":
        return 1;
      case "warning_2":
        return 2;
      case "probation":
        return 3;
      default:
        return undefined;
    }
  }, [warningFilter]);

  async function fetchEvaluation(nextPage = 1, nextSize = size) {
    try {
      setLoading(true);
      setError(null);
      // must have semesterId
      if (!semester) {
  setRows([]);
  setTotal(0);
  setPage(1);
        return;
      }
      const params = new URLSearchParams();
      params.set("semesterId", semester);
      if (searchText) {
        params.set("fullName", searchText);
        params.set("studentCode", searchText);
      }
  const norm = (v: string) => (v && v !== "all" ? v : "");
  if (norm(faculty)) params.set("facultyName", norm(faculty));
  if (norm(classroom)) params.set("className", norm(classroom));
  if (norm(academicStatus)) params.set("academicStatus", norm(academicStatus));
  if (norm(accountStatus)) params.set("status", norm(accountStatus));
      if (mapGpaRange.gpaMin != null) params.set("gpaMin", String(mapGpaRange.gpaMin));
      if (mapGpaRange.gpaMax != null) params.set("gpaMax", String(mapGpaRange.gpaMax));
      if (warningCountFromFilter != null) params.set("warningsCount", String(warningCountFromFilter));
      params.set("page", String(nextPage));
      params.set("size", String(nextSize));
      params.set("sort", "gpa4,asc");

      const res = await fetch(`${API_BASE}/api/academic-warnings/evaluation?${params.toString()}`, { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.returnCode === 0) {
        setRows(json.data?.items ?? []);
        setPage(json.data?.page ?? nextPage);
        setTotal(json.data?.total ?? 0);
        setSize(nextSize);
      } else {
        setError(json?.message || "Không thể tải dữ liệu");
        setRows([]);
        setTotal(0);
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  const handleClearFilters = () => {
    setFaculty("");
    setClassroom("");
    setSemester("");
    setAcademicStatus("");
    setAccountStatus("");
    setGpaRange("");
    setWarningFilter("");
    setSearchText("");
    setRows([]);
    setTotal(0);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb items={[{ label: "Quản lý học tập", href: "/admin" }, { label: "Bảng điểm tổng hợp" }]} />

      <div className="border rounded-xl p-4 bg-white shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-600" />
            Bộ lọc tìm kiếm
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-sm text-gray-600 hover:text-red-600">
            Xóa bộ lọc
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Khoa */}
          <Select value={faculty} onValueChange={setFaculty}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn khoa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả khoa</SelectItem>
              {faculties.map((f) => (
                <SelectItem key={f.id} value={f.name}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Lớp */}
          <Select value={classroom} onValueChange={setClassroom}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Học kỳ */}
          <Select value={semester} onValueChange={setSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Trạng thái học tập */}
          <Select value={academicStatus} onValueChange={setAcademicStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái học tập" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="studing">Đang học</SelectItem>
              <SelectItem value="warning">Cảnh báo</SelectItem>
              <SelectItem value="failed">Trượt</SelectItem>
            </SelectContent>
          </Select>

          {/* Trạng thái tài khoản */}
          <Select value={accountStatus} onValueChange={setAccountStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái tài khoản" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Bị khóa</SelectItem>
              <SelectItem value="suspended">Chờ kích hoạt</SelectItem>
            </SelectContent>
          </Select>

          {/* Khoảng GPA */}
          <Select value={gpaRange} onValueChange={setGpaRange}>
            <SelectTrigger>
              <SelectValue placeholder="Khoảng điểm trung bình (GPA)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="4">= 4.0</SelectItem>
              <SelectItem value="3">3.0 - 3.9</SelectItem>
              <SelectItem value="2">2.0 - 2.9</SelectItem>
              <SelectItem value="1">Dưới 2.0</SelectItem>
            </SelectContent>
          </Select>

          {/* Trạng thái cảnh cáo (suy diễn warningsCount) */}
          <Select value={warningFilter} onValueChange={setWarningFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái cảnh cáo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="none">Bình thường</SelectItem>
              <SelectItem value="warning_1">Cảnh báo 1</SelectItem>
              <SelectItem value="warning_2">Cảnh báo 2</SelectItem>
              <SelectItem value="probation">Nguy cơ thôi học</SelectItem>
            </SelectContent>
          </Select>

          {/* Tên hoặc MSSV */}
          <div className="flex items-center gap-2">
            <Input placeholder="Tìm theo tên hoặc MSSV..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            {searchText && (
              <Button variant="ghost" size="icon" onClick={() => setSearchText("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="w-full sm:w-auto" onClick={() => fetchEvaluation(1, size)} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Đang tải..." : "Tìm kiếm"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
        {error && (
          <div className="p-3 text-sm text-red-600">{error}</div>
        )}
        <DataTable
          headers={[
            "#",
            "Mã SV",
            "Họ tên",
            "Lớp",
            "Khoa",
            "Học kỳ",
            "GPA (4)",
            "Môn trượt",
            "Số lần cảnh cáo",
            "Trạng thái học tập",
            "Chuyên cần (%)",
            "Cảnh cáo gần nhất",
            "Thao tác",
          ]}
          maxHeight="450px"
        >
          {rows.map((r, i) => (
            <tr key={`${r.studentId}-${i}`} className="hover:bg-gray-50">
              <td className="px-4 py-3 border-b">{(page - 1) * size + i + 1}</td>
              <td className="px-4 py-3 border-b">{r.studentCode}</td>
              <td className="px-4 py-3 border-b">{r.fullName}</td>
              <td className="px-4 py-3 border-b">{r.className ?? "-"}</td>
              <td className="px-4 py-3 border-b">{r.facultyName ?? "-"}</td>
              <td className="px-4 py-3 border-b">{r.semesterName ?? r.semesterId ?? "-"}</td>
              <td className="px-4 py-3 border-b font-medium">{r.gpa4 ?? "-"}</td>
              <td className="px-4 py-3 border-b text-red-600">{r.failedSubjects}</td>
              <td className="px-4 py-3 border-b">{r.warningsCount}</td>
              <td className="px-4 py-3 border-b">{r.academicStatus}</td>
              <td className="px-4 py-3 border-b">{r.attendanceRate != null ? `${r.attendanceRate}%` : "-"}</td>
              <td className="px-4 py-3 border-b">
                <span suppressHydrationWarning>
                  {r.lastWarningAt ? new Date(r.lastWarningAt).toLocaleString("vi-VN") : "-"}
                </span>
              </td>
              <td className="px-4 py-3 border-b">
                <RowActionsLearningDataOverview
                  studentId={String(r.studentId)}
                  studentName={r.fullName}
                  isBusy={false}
                  onCreateWarning={(id: string, name: string) => {
                    // TODO: wire to POST /api/academic-warnings
                    console.log("create warning", id, name);
                  }}
                  onViewDetails={(id: string) => {
                    // TODO: open details modal or navigate
                    console.log("view details", id);
                  }}
                  onViewWarningHistory={(id: string) => {
                    // TODO: open history modal
                    console.log("view history", id);
                  }}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {total > 0 && (
        <div className="flex justify-end">
          <Pagination
            totalItems={total}
            pageSize={size}
            currentPage={page}
            onChange={(p: number) => {
              setPage(p);
              fetchEvaluation(p, size);
            }}
            item="sinh viên"
          />
        </div>
      )}
    </div>
  );
}
