"use client";

import { useEffect, useMemo, useState } from "react";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { RowActionsLearningDataOverview } from "@/components/admin/modals_UI/RowActions_LearningDataOverview";
import { AccountPagination } from "@/components/admin/modals_UI/AccountPagination";
import { WarningHistoryModal } from "@/components/admin/modals_UI/WarningHistoryModal";
import { CreateWarningModal } from "@/components/admin/modals_UI/CreateWarningModal";

type OverviewItem = {
  student_id: number | string;
  student_code: string;
  full_name: string;
  class: string;
  faculty: string;
  semester: string | null;
  semester_id?: number | null;
  gpa: number | null;
  failed_subjects: number;
  total_warning: number;
  academic_status: string;
  attendance_rate: number | null;
  latest_warning: string | null;
  proposed_warning_level?: number;
  proposed_action?: string;
};

type Meta = { total: number; totalPages: number; page: number; pageSize: number };

export default function LearningDataOverview() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
  const getToken = () => {
    try {
      if (typeof document !== "undefined") {
        const cookieToken = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];
        const lsToken = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
        return cookieToken || lsToken || null;
      }
    } catch {}
    return null;
  };

  const [searchText, setSearchText] = useState("");
  const [faculty, setFaculty] = useState<string>("");
  const [classroom, setClassroom] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("");
  const [semester, setSemester] = useState<string>(""); 
  const [academicStatus, setAcademicStatus] = useState<string>("");
  const [gpaRange, setGpaRange] = useState<string>("");
  const [warningFilter, setWarningFilter] = useState<string>("");
  const [scope, setScope] = useState<"semester" | "all">("semester");
  const [gpaMinInput, setGpaMinInput] = useState<string>("");
  const [gpaMaxInput, setGpaMaxInput] = useState<string>("");
  const [failedMaxInput, setFailedMaxInput] = useState<string>("");
  const [attendanceMinInput, setAttendanceMinInput] = useState<string>("");

  const [rows, setRows] = useState<OverviewItem[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, totalPages: 1, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [warningOpen, setWarningOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [selectedForCreate, setSelectedForCreate] = useState<string | null>(null);
  const [selectedSemesterIdForCreate, setSelectedSemesterIdForCreate] = useState<number | null>(null);

  const [semestersData, setSemestersData] = useState<Array<{ id: number; name: string; academic_year: string | null }>>([]);
  const [facultiesData, setFacultiesData] = useState<Array<{ id: number; name: string }>>([]);
  const [classesData, setClassesData] = useState<Array<{ id: number; class_code: string }>>([]);
  const academicYears = useMemo(() => {
    const years = Array.from(new Set(semestersData.map((s) => s.academic_year || ""))).filter(Boolean) as string[];
    return years.sort();
  }, [semestersData]);
  const semestersByYear = useMemo(() => {
    const map = new Map<string, Array<{ id: number; name: string }>>();
    semestersData.forEach((s) => {
      const y = (s.academic_year || "").toString();
      if (!y) return;
      const arr = map.get(y) ?? [];
      arr.push({ id: s.id, name: s.name });
      map.set(y, arr);
    });
    return map;
  }, [semestersData]);


 
  useEffect(() => {
    let alive = true;
    const loadSemesters = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/semesters`, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (!alive) return;
        if (json?.returnCode === 0 && Array.isArray(json.data)) {
          setSemestersData(json.data);
        }
      } catch {

      }
    };
    const loadFaculties = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/faculties`, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (!alive) return;
        if (json?.returnCode === 0 && Array.isArray(json.data)) {
          type F = { id: number; name: string };
          const items: F[] = json.data.map((f: unknown) => {
            const obj = f as { id?: number; name?: string };
            return { id: Number(obj.id), name: String(obj.name || "") };
          });
          setFacultiesData(items);
        }
      } catch {

      }
    };
    const loadClasses = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_BASE}/api/classes`, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (!alive) return;
        if (json?.returnCode === 0 && Array.isArray(json.data)) {
          type C = { id: number; class_code: string };
          const items: C[] = json.data.map((c: unknown) => {
            const obj = c as { id?: number; class_code?: string };
            return { id: Number(obj.id), class_code: String(obj.class_code || "") };
          });
          setClassesData(items);
        }
      } catch {
     
      }
    };
    loadSemesters();
    loadFaculties();
    loadClasses();
    return () => { alive = false; };
  }, [API_BASE]);


  const buildOverviewUrl = (overrides?: { p?: number; ps?: number; search?: string; semId?: string }) => {
    const params = new URLSearchParams();
    const currentPage = overrides?.p ?? page;
    const currentPageSize = overrides?.ps ?? pageSize;
    const currentSearch = overrides?.search ?? searchText.trim();
    const semId = overrides?.semId ?? semester;
    if (scope === "semester" && semId) params.set("semesterId", semId);
    if (currentSearch) params.set("search", currentSearch);
    params.set("page", String(currentPage));
    params.set("pageSize", String(currentPageSize));
    return `${API_BASE}/api/students/overview?${params.toString()}`;
  };

  const fetchOverview = async (overrides?: { p?: number; ps?: number; search?: string; semId?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const url = buildOverviewUrl(overrides);
      const token = getToken();
      const res = await fetch(url, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json?.returnCode !== 0) throw new Error(json?.message || "Fetch failed");
      setRows(Array.isArray(json.data) ? json.data : []);
      const m = json.meta || { total: 0, totalPages: 1, page: overrides?.p ?? page, pageSize: overrides?.ps ?? pageSize };
      setMeta({ total: m.total || 0, totalPages: m.totalPages || 1, page: m.page || (overrides?.p ?? page), pageSize: m.pageSize || (overrides?.ps ?? pageSize) });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi tải dữ liệu";
      setError(msg);
      setRows([]);
      const ps = overrides?.ps ?? pageSize;
      setMeta({ total: 0, totalPages: 1, page: 1, pageSize: ps });
    } finally {
      setLoading(false);
    }
  };

  const openWarningHistory = (studentId: string) => {
    setSelectedStudentId(studentId);
    setWarningOpen(true);
  };


  useEffect(() => {
    setSemester("");
  }, [academicYear]);

  const handleClearFilters = () => {
    setFaculty("");
    setClassroom("");
    setAcademicYear("");
    setSemester("");
    setAcademicStatus("");
    setGpaRange("");
    setWarningFilter("");
    setScope("semester");
    setGpaMinInput("");
    setGpaMaxInput("");
    setFailedMaxInput("");
    setAttendanceMinInput("");
    setSearchText("");
    setPage(1);
    setPageSize(20);
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
          {/* Phạm vi */}
          <Select value={scope} onValueChange={(v) => setScope(v as "semester" | "all")}>
            <SelectTrigger>
              <SelectValue placeholder="Phạm vi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semester">Theo học kỳ</SelectItem>
              <SelectItem value="all">Tổng tất cả kỳ</SelectItem>
            </SelectContent>
          </Select>
          {/* Khoa */}
          <Select value={faculty} onValueChange={setFaculty}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn khoa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả khoa</SelectItem>
              {facultiesData.map((f) => (
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
              {classesData.map((c) => (
                <SelectItem key={c.id} value={c.class_code}>
                  {c.class_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Học kỳ: chọn academic_year trước, sau đó mới chọn học kỳ (name/id) */}
          <Select value={academicYear} onValueChange={setAcademicYear} disabled={scope === "all"}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn năm học" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={semester} onValueChange={setSemester} disabled={scope === "all" || !academicYear}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              {(semestersByYear.get(academicYear) || []).map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Trạng thái học tập */}
          {/* <Select value={academicStatus} onValueChange={setAcademicStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái học tập" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="studing">Đang học</SelectItem>
              <SelectItem value="warning">Cảnh báo</SelectItem>
              <SelectItem value="failed">Trượt</SelectItem>
            </SelectContent>
          </Select> */}

          {/* Trạng thái tài khoản */}
          {/* <Select value={accountStatus} onValueChange={setAccountStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái tài khoản" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Bị khóa</SelectItem>
              <SelectItem value="suspended">Chờ kích hoạt</SelectItem>
            </SelectContent>
          </Select> */}

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

          {/* GPA (từ - đến) */}
          {/* <div className="flex items-center gap-2">
            <Input type="number" step="0.1" min="0" max="4" placeholder="GPA từ" value={gpaMinInput} onChange={(e) => setGpaMinInput(e.target.value)} />
            <Input type="number" step="0.1" min="0" max="4" placeholder="đến" value={gpaMaxInput} onChange={(e) => setGpaMaxInput(e.target.value)} />
          </div> */}

          {/* Môn trượt tối đa */}
          {/* <Input type="number" min="0" placeholder="Môn trượt tối đa" value={failedMaxInput} onChange={(e) => setFailedMaxInput(e.target.value)} /> */}

          {/* Chuyên cần tối thiểu (%) */}
          {/* <Input type="number" min="0" max="100" placeholder="Chuyên cần tối thiểu (%)" value={attendanceMinInput} onChange={(e) => setAttendanceMinInput(e.target.value)} /> */}

          {/* Trạng thái cảnh cáo (suy diễn warningsCount) */}
          {/* <Select value={warningFilter} onValueChange={setWarningFilter}>
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
          </Select> */}

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
          <Button className="w-full sm:w-auto" onClick={() => { setPage(1); fetchOverview({ p: 1 }); }} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
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
            "Đề xuất xử lí",
            "Thao tác",
          ]}
          maxHeight="450px"
        >
          {error && (
            <tr>
              <td className="px-4 py-6 text-red-600" colSpan={14}>{error}</td>
            </tr>
          )}
          {!error && rows.length === 0 && !loading && (
            <tr>
              <td className="px-4 py-6 text-gray-500" colSpan={14}>
                <p>Không có dữ liệu phù hợp. Hãy thay đổi điều kiện và thử lại.</p>
              </td>
            </tr>
          )}
          {!error && rows.length > 0 && (
            <>
              {rows
                .filter((r) => {
                  if (faculty && faculty !== "all" && r.faculty !== faculty) return false;
                  if (classroom && classroom !== "all" && r.class !== classroom) return false;
                  if (academicStatus && academicStatus !== "all" && r.academic_status !== academicStatus) return false;
                  if (gpaRange && gpaRange !== "all") {
                    const g = r.gpa ?? 0;
                    if (gpaRange === "4" && g !== 4.0) return false;
                    if (gpaRange === "3" && !(g >= 3.0 && g < 4.0)) return false;
                    if (gpaRange === "2" && !(g >= 2.0 && g < 3.0)) return false;
                    if (gpaRange === "1" && !(g < 2.0)) return false;
                  }
                  const gpaMin = gpaMinInput ? parseFloat(gpaMinInput) : undefined;
                  const gpaMax = gpaMaxInput ? parseFloat(gpaMaxInput) : undefined;
                  if (gpaMin != null && (r.gpa ?? 0) < gpaMin) return false;
                  if (gpaMax != null && (r.gpa ?? 0) > gpaMax) return false;
                  const failedMax = failedMaxInput ? parseInt(failedMaxInput) : undefined;
                  if (failedMax != null && r.failed_subjects > failedMax) return false;
                  const attendMin = attendanceMinInput ? parseFloat(attendanceMinInput) : undefined;
                  if (attendMin != null && (r.attendance_rate ?? 0) < attendMin) return false;
                  if (warningFilter && warningFilter !== "all") {
                    if (warningFilter === "none" && r.total_warning > 0) return false;
                    if (warningFilter === "warning_1" && r.total_warning < 1) return false;
                    if (warningFilter === "warning_2" && r.total_warning < 2) return false;
                    if (warningFilter === "probation" && r.total_warning < 3) return false;
                  }
                  return true;
                })
                .map((r, idx) => (
                  <tr key={`${r.student_id}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b">{(meta.page - 1) * meta.pageSize + idx + 1}</td>
                    <td className="px-4 py-3 border-b">{r.student_code}</td>
                    <td className="px-4 py-3 border-b">{r.full_name}</td>
                    <td className="px-4 py-3 border-b">{r.class}</td>
                    <td className="px-4 py-3 border-b">{r.faculty}</td>
                    <td className="px-4 py-3 border-b">{r.semester ?? "-"}</td>
                    <td className="px-4 py-3 border-b font-medium">{r.gpa ?? "-"}</td>
                    <td className="px-4 py-3 border-b text-red-600">{r.failed_subjects}</td>
                    <td className="px-4 py-3 border-b">{r.total_warning}</td>
                    <td className="px-4 py-3 border-b">{r.academic_status}</td>
                    <td className="px-4 py-3 border-b">{r.attendance_rate != null ? `${r.attendance_rate}%` : "-"}</td>
                    <td className="px-4 py-3 border-b">{r.latest_warning ? new Date(r.latest_warning).toLocaleString() : "-"}</td>
                    <td className="px-4 py-3 border-b">{r.proposed_action || "-"}</td>
                    <td className="px-4 py-3 border-b">
                      <RowActionsLearningDataOverview
                        studentId={String(r.student_id)}
                        studentName={r.full_name}
                        isBusy={false}
                        proposedLabel={r.proposed_action}
                        proposedLevel={r.proposed_warning_level}
                        onCreateWarning={(id) => {
                          setSelectedForCreate(id);
                          setSelectedSemesterIdForCreate(r.semester_id != null ? Number(r.semester_id) : null);
                          setOpenModal(true);
                        }}
                        onViewDetails={() => {}}
                        onViewWarningHistory={(id) => openWarningHistory(id)}
                      />
                    </td>
                  </tr>
                ))}
            </>
          )}
        </DataTable>
      </div>

      {/* Pagination Controls (reused component) */}
      <AccountPagination
        currentPage={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        pageSize={meta.pageSize}
        disabled={loading}
        onChangePageSize={async (newSize) => {
          setPageSize(newSize);
          setPage(1);
          await fetchOverview({ p: 1, ps: newSize });
        }}
        onChangePage={async (newPage) => {
          setPage(newPage);
          await fetchOverview({ p: newPage });
        }}
      />

      {/* Warning History Modal */}
      <WarningHistoryModal
        open={warningOpen}
        onClose={() => setWarningOpen(false)}
        studentId={selectedStudentId || undefined}
        semesterId={scope === "semester" && semester ? semester : undefined}
        apiBase={API_BASE}
      />
      {/* Create Warning Modal */}
      <CreateWarningModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        studentId={selectedForCreate ? Number(selectedForCreate) : null}
        semesterId={selectedSemesterIdForCreate}
        apiBase={API_BASE}
        defaultLevel={(rows.find(r => String(r.student_id) === String(selectedForCreate))?.proposed_warning_level ?? 1) === 3 ? "major"
          : (rows.find(r => String(r.student_id) === String(selectedForCreate))?.proposed_warning_level ?? 1) === 2 ? "moderate" : "minor"}
      />

    </div>
  );
}
