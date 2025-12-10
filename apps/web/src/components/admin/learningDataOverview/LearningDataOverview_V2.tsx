"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { AccountPagination } from "@/components/admin/modals_UI/AccountPagination";
import { RowActionsLearningDataOverview } from "@/components/admin/modals_UI/RowActions_LearningDataOverview";
import { WarningHistoryModal } from "@/components/admin/modals_UI/WarningHistoryModal";
import { CreateWarningModal } from "@/components/admin/modals_UI/CreateWarningModal";
import { translateWarningLevel } from "@packages/utils/translations";
import { createAcademicWarningsApi } from "@/services/academicWarnings";
import { WarningSummaryStats } from "./WarningSummaryStats";
import { WarningDistributionChart } from "./WarningDistributionChart";

type V2Row = {
  user_id?: number | string;
  student_id?: number | string;
  student_code: string;
  full_name: string;
  class_code: string;
  academic_year: string | null;
  semester_name: string | null;
  semester_id?: number | null;
  avg_score_4: number | null;
  cum_avg_score_4: number | null;
  total_credit_failed: number | null;
  failed_over_50: boolean;
  under_threshold: boolean;
  total_credit_failed_cumulative: number | null;
  previous_warnings_count: number;
  proposed_warning_level: "FIRST" | "SECOND" | "FINAL" | null;
  violation_reasons: string[];
  is_warned?: boolean; 
};

type Meta = { total: number; page: number; pageSize: number };

export default function LearningDataOverview_V2() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const api = useMemo(() => createAcademicWarningsApi(API_BASE), [API_BASE]);

  const [searchText, setSearchText] = useState("");
  const [classroom, setClassroom] = useState<string>("");
  const [academicYear, setAcademicYear] = useState<string>("");
  const [semester, setSemester] = useState<string>("");


  const [rows, setRows] = useState<V2Row[]>([]);
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);




  const [warningOpen, setWarningOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedForCreate, setSelectedForCreate] = useState<string | null>(null);
  const [selectedSemesterIdForCreate, setSelectedSemesterIdForCreate] = useState<number | null>(null);
  const [selectedStudentDataForCreate, setSelectedStudentDataForCreate] = useState<V2Row | null>(null);

  const [semestersData, setSemestersData] = useState<Array<{ id: number; name: string; academic_year: string | null }>>([]);
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
        const controller = new AbortController();
        const data = await api.fetchSemesters(controller.signal);
        if (!alive) return;
        setSemestersData(data);
      } catch {}
    };
    const loadClasses = async () => {
      try {
        const controller = new AbortController();
        const data = await api.fetchClasses(controller.signal);
        if (!alive) return;
        setClassesData(data);
      } catch {}
    };
    loadSemesters();
    loadClasses();
    return () => {
      alive = false;
    };
  }, [API_BASE, api]);

  useEffect(() => {
    setSemester("");
  }, [academicYear]);

  const buildParams = useCallback((overrides?: { p?: number; ps?: number; search?: string; semId?: string }) => {
    const params = new URLSearchParams();
    const currentPage = overrides?.p ?? page;
    const currentPageSize = overrides?.ps ?? pageSize;
    const currentSearch = overrides?.search ?? searchText.trim();
    const semId = overrides?.semId ?? semester;
    if (semId) params.set("semesterId", semId);
    if (currentSearch) params.set("search", currentSearch);
    if (academicYear) params.set("academicYear", academicYear);
    if (classroom && classroom !== "all") params.set("classCode", classroom);
    params.set("page", String(currentPage));
    params.set("pageSize", String(currentPageSize));
    return params;
  }, [page, pageSize, searchText, semester, academicYear, classroom]);

  const fetchData = async (overrides?: { p?: number; ps?: number; search?: string; semId?: string }) => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    try {
      const params = buildParams(overrides);
      const json = await api.fetchV2List(params, controller.signal);
      if (json?.returnCode !== 0) throw new Error(json?.message || "Fetch failed");
      const data: V2Row[] = Array.isArray(json.data) ? json.data : [];
      setRows(data);
      const m = json.meta || { total: 0, page: overrides?.p ?? page, pageSize: overrides?.ps ?? pageSize };
      setMeta({ total: m.total || 0, page: m.page || (overrides?.p ?? page), pageSize: m.pageSize || (overrides?.ps ?? pageSize) });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi tải dữ liệu";
      setError(msg);
      setRows([]);
      const ps = overrides?.ps ?? pageSize;
      setMeta({ total: 0, page: 1, pageSize: ps });
    } finally {
      setLoading(false);
    }
  };


  const handleClearFilters = () => {
    setClassroom("");
    setAcademicYear("");
    setSemester("");
    setSearchText("");
    setPage(1);
    setPageSize(20);
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil((meta.total || 0) / (meta.pageSize || 20))), [meta.total, meta.pageSize]);

  const openWarningHistory = (userId: string) => {
    setSelectedStudentId(userId);
    setWarningOpen(true);
  };

  const handleMarkAsWarned = async (studentId: string, studentName: string, semesterId: number | null) => {
    if (!semesterId) {
      alert("Không thể xác định semester để đánh dấu cảnh cáo");
      return;
    }

    try {

      const levelInput = prompt("Chọn mức cảnh cáo (FIRST, SECOND, FINAL):", "FIRST");
      const level = (levelInput || "FIRST").toUpperCase();
      const valid = ["FIRST", "SECOND", "FINAL"]; 
      const chosen = (valid.includes(level) ? level : "FIRST") as "FIRST" | "SECOND" | "FINAL";

      const result = await api.markWarned({
        studentId: Number(studentId),
        semesterId: Number(semesterId),
        level: chosen,
      });
      
      if (result.returnCode === 0) {
        alert(`Đã đánh dấu ${studentName} là đã cảnh cáo (${chosen})`);

        await fetchData();
      } else {
        alert(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error("Error marking as warned:", error);
      alert("Có lỗi xảy ra khi đánh dấu cảnh cáo");
    }
  };

  const proposedLevelNumber = (lvl: V2Row["proposed_warning_level"]): number | undefined => {
    if (lvl === "FIRST") return 1;
    if (lvl === "SECOND") return 2;
    if (lvl === "FINAL") return 3;
    return undefined;
  };

  return (
    <div className="max-w-full mx-auto py-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý cảnh cáo học tập</h1>
        <p className="text-muted-foreground">Tạo và quản lý cảnh cáo học tập</p>
      </div>

      <div className="border rounded-xl p-5 bg-white shadow-sm space-y-6 mb-6 dark:bg-card dark:border-border">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-600" /> Bộ lọc tìm kiếm
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-sm text-gray-600 hover:text-red-600">
            Xóa bộ lọc
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

          {/* Năm học */}
          <Select value={academicYear} onValueChange={setAcademicYear}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn năm học" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Học kỳ (phụ thuộc năm học) */}
          <Select value={semester} onValueChange={setSemester} disabled={!academicYear}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              {(semestersByYear.get(academicYear) || []).map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
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
          <Button className="w-full sm:w-auto" onClick={() => { setPage(1); fetchData({ p: 1 }); }} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </Button>
        </div>
       </div>

      {/* Table (auto height, no vertical scrollbar) */}
      <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
        <DataTable
          headers={[
            "Mã sinh viên",
            "Họ và tên",
            "Lớp học",
            "Năm học",
            "Học kỳ",
            "Điểm TB học kỳ (4)",
            "Điểm TBTL (4)",
            "Tín chỉ không đạt",
            "Rớt >50% tín chỉ",
            "Dưới ngưỡng GPA",
            "Tín chỉ nợ lũy kế",
            "Số lần cảnh cáo trước",
            "Mức cảnh cáo đề xuất",
            "Lý do vi phạm",
            "Thao tác",
          ]}
        >
          {error && (
            <tr>
              <td className="px-4 py-6 text-red-600" colSpan={15}>
                {error}
              </td>
            </tr>
          )}
          {!error && rows.length === 0 && !loading && (
            <tr>
              <td className="px-4 py-8 text-center text-muted-foreground" colSpan={10}>
                <p>Vui lòng nhấn tìm kiếm để xem kết quả.</p>
              </td>
            </tr>
          )}
          {!error && loading && (
            <tr>
              <td className="px-4 py-8 text-center text-muted-foreground" colSpan={10}>
                Đang tải dữ liệu...
              </td>
            </tr>
          )}
          {!error && rows.length > 0 && (
            <>
              {rows.map((r, idx) => (
                <tr key={`${r.student_code}-${idx}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b">{r.student_code}</td>
                  <td className="px-4 py-3 border-b">{r.full_name}</td>
                  <td className="px-4 py-3 border-b">{r.class_code}</td>
                  <td className="px-4 py-3 border-b">{r.academic_year ?? "-"}</td>
                  <td className="px-4 py-3 border-b">{r.semester_name ?? "-"}</td>
                  <td className="px-4 py-3 border-b font-medium">{r.avg_score_4 ?? "-"}</td>
                  <td className="px-4 py-3 border-b font-medium">{r.cum_avg_score_4 ?? "-"}</td>
                  <td className="px-4 py-3 border-b text-red-600">{r.total_credit_failed ?? "-"}</td>
                  <td className="px-4 py-3 border-b">{r.failed_over_50 ? "Có" : "Không"}</td>
                  <td className="px-4 py-3 border-b">{r.under_threshold ? "Có" : "Không"}</td>
                  <td className="px-4 py-3 border-b">{r.total_credit_failed_cumulative ?? "-"}</td>
                  <td className="px-4 py-3 border-b">{r.previous_warnings_count}</td>
                  <td className="px-4 py-3 border-b"> {translateWarningLevel(r.proposed_warning_level) ?? "-"}</td>
                  <td className="px-4 py-3 border-b whitespace-pre-wrap">{Array.isArray(r.violation_reasons) && r.violation_reasons.length > 0 ? r.violation_reasons.join("\n") : "-"}</td>
                  <td className="px-4 py-3 border-b">
                    <RowActionsLearningDataOverview
                      studentId={String(r.user_id ?? r.student_id ?? "")}
                      studentName={r.full_name}
                      isBusy={false}
                      proposedLabel={r.proposed_warning_level ? `Cảnh cáo ${proposedLevelNumber(r.proposed_warning_level)}` : undefined}
                      proposedLevel={proposedLevelNumber(r.proposed_warning_level)}
                      isWarned={r.is_warned || false}
                      onCreateWarning={(id) => {
                        setSelectedForCreate(id);
                        setSelectedSemesterIdForCreate(r.semester_id != null ? Number(r.semester_id) : null);
                        setSelectedStudentDataForCreate(r);
                        setOpenModal(true);
                      }}
                      onMarkAsWarned={(id, name) => {
                        handleMarkAsWarned(id, name, r.semester_id ?? null);
                      }}
                      onViewWarningHistory={(id) => openWarningHistory(id)}
                    />
                  </td>
                </tr>
              ))}

            </>
          )}
        </DataTable>
      </div>

      {/* Pagination Controls */}
      <AccountPagination
        currentPage={meta.page}
        totalPages={totalPages}
        total={meta.total}
        pageSize={meta.pageSize}
        disabled={loading}
        onChangePageSize={async (newSize) => {
          setPageSize(newSize);
          setPage(1);
          await fetchData({ p: 1, ps: newSize });
        }}
        onChangePage={async (newPage) => {
          setPage(newPage);
          await fetchData({ p: newPage });
        }}
      />

      {/* Stats & Charts (teacher-like) - below pagination */}
      <WarningSummaryStats rows={rows} />
      <WarningDistributionChart rows={rows} />

      {/* Warning History Modal */}
      <WarningHistoryModal
        open={warningOpen}
        onClose={() => setWarningOpen(false)}
        studentId={selectedStudentId || undefined}
        semesterId={semester || undefined}
        apiBase={API_BASE}
        semesters={semestersData}
      />
      {/* Create Warning Modal */}
      <CreateWarningModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setSelectedForCreate(null);
          setSelectedSemesterIdForCreate(null);
          setSelectedStudentDataForCreate(null);
        }}
        studentId={selectedForCreate ? Number(selectedForCreate) : null}
        semesterId={selectedSemesterIdForCreate}
        apiBase={API_BASE}
        defaultLevel={(rows.find((x) => String(x.user_id ?? x.student_id) === String(selectedForCreate))?.proposed_warning_level) ?? "FIRST"}
        studentData={selectedStudentDataForCreate ? {
          avg_score_4: selectedStudentDataForCreate.avg_score_4,
          cum_avg_score_4: selectedStudentDataForCreate.cum_avg_score_4,
          total_credit_failed: selectedStudentDataForCreate.total_credit_failed,
          total_credit_failed_cumulative: selectedStudentDataForCreate.total_credit_failed_cumulative,
          academic_status: null, 
        } : undefined}
        onCreated={() => {
          fetchData();
        }}
      />
    </div>
  );
}
