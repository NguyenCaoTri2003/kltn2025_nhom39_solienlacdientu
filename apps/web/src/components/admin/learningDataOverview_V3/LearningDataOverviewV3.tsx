"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
import { WarningSummaryStats } from "./WarningSummaryStats_V3";
import { WarningDistributionChart } from "./WarningDistributionChart_V3";

type V3Row = {
  user_id?: number | string;
  student_id?: number | string;
  student_code: string;
  full_name: string;
  class_code: string;
  academic_year: string | null;
  semester_name: string | null;
  semester_id?: number | null;
  semester_number?: number | null;
  avg_score_4: number | null;
  cum_avg_score_4: number | null;
  total_credit_failed: number | null;
  total_credit_failed_cumulative: number | null;
  total_credit_registered: number | null;
  year_of_study: number | null;
  
  // Thresholds
  semester_gpa_threshold: number | null;
  cumulative_gpa_threshold: number | null;
  
  // Violation flags
  failed_over_50: boolean;
  cumulative_failed_over_24: boolean;
  semester_gpa_below_threshold: boolean;
  cumulative_gpa_below_threshold: boolean;
  
  // Warning history
  previous_warnings_count: number;
  consecutive_warnings_count: number;
  warnings_count_total?: number;
  
  // Results
  proposed_warning_level: "FIRST" | "SECOND" | "FINAL" | "EXPULSION" | null;
  violation_reasons: string[];
  expulsion_candidate: boolean;
  expulsion_reasons: string[];
  is_warned?: boolean;
};

type Meta = { total: number; page: number; pageSize: number };

export default function LearningDataOverview_V3() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const api = useMemo(() => createAcademicWarningsApi(API_BASE), [API_BASE]);

  const [searchText, setSearchText] = useState("");
  const [classroom, setClassroom] = useState<string>(""); // Mặc định là empty
  const [selectedMajorId, setSelectedMajorId] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "proposed">("proposed"); // Mặc định là "proposed"

  const [rows, setRows] = useState<V3Row[]>([]);
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
  const [selectedStudentDataForCreate, setSelectedStudentDataForCreate] = useState<V3Row | null>(null);

  const [semestersData, setSemestersData] = useState<Array<{ id: number; name: string; academic_year: string | null; start_date?: string | null; end_date?: string | null }>>([]);
  const [classesData, setClassesData] = useState<Array<{ id: number; class_code: string }>>([]);
  const [majorsData, setMajorsData] = useState<Array<{ id: number; name: string; major_code: string }>>([]);
  const [currentSemesterId, setCurrentSemesterId] = useState<number | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string | null>(null);
  
  const academicYears = useMemo(() => {
    const years = Array.from(new Set(semestersData.map((s) => s.academic_year || ""))).filter(Boolean) as string[];
    return years.sort();
  }, [semestersData]);

  const semestersByYear = useMemo(() => {
    if (!selectedAcademicYear || selectedAcademicYear === "all") {
      return semestersData.sort((a, b) => {
        if (a.start_date && b.start_date) {
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        }
        return 0;
      });
    }
    return semestersData
      .filter((s) => s.academic_year === selectedAcademicYear)
      .sort((a, b) => {
        if (a.start_date && b.start_date) {
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        }
        return 0;
      });
  }, [semestersData, selectedAcademicYear]);

  const findCurrentSemester = useCallback((semesters: Array<{ id: number; name: string; academic_year: string | null; start_date?: string | null; end_date?: string | null }>) => {
    const today = new Date();
    const current = semesters.find((s) => {
      if (!s.start_date || !s.end_date) return false;
      const start = new Date(s.start_date);
      const end = new Date(s.end_date);
      return today >= start && today <= end;
    });
    
    if (current) {
      return { 
        id: current.id, 
        name: current.name,
        academicYear: current.academic_year 
      };
    }
    

    if (semesters.length > 0) {
      const latest = semesters.sort((a, b) => {
        if (a.start_date && b.start_date) {
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        }
        return 0;
      })[0];
      return { 
        id: latest.id, 
        name: latest.name,
        academicYear: latest.academic_year 
      };
    }
    
    return null;
  }, []);

  useEffect(() => {
    let alive = true;
    const loadSemesters = async () => {
      try {
        const controller = new AbortController();
        const data = await api.fetchSemesters(controller.signal);
        if (!alive) return;
        setSemestersData(data);

        const current = findCurrentSemester(data);
        if (current) {
          setCurrentSemesterId(current.id);
          if (current.academicYear) {
            setCurrentAcademicYear(current.academicYear);
            setSelectedAcademicYear(current.academicYear);
            setSelectedSemesterId(String(current.id));
          }
        }
      } catch {}
    };
    const loadMajors = async () => {
      try {
        const controller = new AbortController();
        const data = await api.fetchAllMajors(controller.signal);
        if (!alive) return;
        setMajorsData(data);
      } catch {}
    };
    loadSemesters();
    loadMajors();
    return () => {
      alive = false;
    };
  }, [API_BASE, api, findCurrentSemester]);

  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  useEffect(() => {
    if (currentSemesterId && !hasInitialLoad) {
      setHasInitialLoad(true);
      fetchData({ p: 1, semId: String(currentSemesterId) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSemesterId]); 

  const buildParams = useCallback((overrides?: { p?: number; ps?: number; search?: string; semId?: string }) => {
    const params = new URLSearchParams();
    const currentPage = overrides?.p ?? page;
    const currentPageSize = overrides?.ps ?? pageSize;
    const currentSearch = overrides?.search ?? searchText.trim();
    const semId = overrides?.semId ?? (selectedSemesterId && selectedSemesterId !== "all" ? selectedSemesterId : "");

    if (semId) params.set("semesterId", semId);
    if (currentSearch) params.set("search", currentSearch);
    if (classroom && classroom !== "all") params.set("classCode", classroom);

    if (statusFilter === "proposed") {
      params.set("onlyProposed", "true");
    }
    
    params.set("page", String(currentPage));
    params.set("pageSize", String(currentPageSize));
    return params;
  }, [page, pageSize, searchText, classroom, selectedSemesterId, statusFilter]);

  const fetchData = async (overrides?: { p?: number; ps?: number; search?: string; semId?: string }) => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    try {
      const params = buildParams(overrides);
      const json = await api.fetchV3List(params, controller.signal);
      if (json?.returnCode !== 0) throw new Error(json?.message || "Fetch failed");
      const data: V3Row[] = Array.isArray(json.data) ? json.data : [];
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
    setSelectedMajorId("");
    setSearchText("");
    setClassesData([]);
    setPage(1);
    setPageSize(20);
    if (currentAcademicYear) {
      setSelectedAcademicYear(currentAcademicYear);
    }
    if (currentSemesterId) {
      setSelectedSemesterId(String(currentSemesterId));
      fetchData({ p: 1, semId: String(currentSemesterId) });
    } else {
      fetchData({ p: 1 });
    }
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

      const levelInput = prompt("Chọn mức cảnh cáo (FIRST, SECOND, FINAL, EXPULSION):", "FIRST");
      const level = (levelInput || "FIRST").toUpperCase();
      const valid = ["FIRST", "SECOND", "FINAL", "EXPULSION"]; 
      const chosen = (valid.includes(level) ? level : "FIRST") as "FIRST" | "SECOND" | "FINAL" | "EXPULSION";

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

  const proposedLevelNumber = (lvl: V3Row["proposed_warning_level"]): number | undefined => {
    if (lvl === "FIRST") return 1;
    if (lvl === "SECOND") return 2;
    if (lvl === "FINAL") return 3;
    if (lvl === "EXPULSION") return 4;
    return undefined;
  };

  return (
    <div className="max-w-full mx-auto py-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý cảnh cáo học tập</h1>
      </div>

      <div className="border rounded-xl p-5 bg-white shadow-sm space-y-6 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-600" /> Bộ lọc tìm kiếm
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-sm text-gray-600 hover:text-red-600">
            Xóa bộ lọc
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          {/* Năm học */}
          <Select value={selectedAcademicYear} onValueChange={(value) => {
            setSelectedAcademicYear(value);
            setPage(1);
            // Nếu chọn "Tất cả", reset học kỳ về "all"
            if (value === "all") {
              setSelectedSemesterId("all");
            } else if (value) {
              // Nếu chọn năm học cụ thể, tự động chọn học kỳ đầu tiên của năm đó
              const firstSemester = semestersData
                .filter((s) => s.academic_year === value)
                .sort((a, b) => {
                  if (a.start_date && b.start_date) {
                    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
                  }
                  return 0;
                })[0];
              if (firstSemester) {
                setSelectedSemesterId(String(firstSemester.id));
              } else {
                setSelectedSemesterId("");
              }
            } else {
              setSelectedSemesterId("");
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn năm học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả năm học</SelectItem>
              {academicYears.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Học kỳ (theo năm học đã chọn) */}
          <Select 
            value={selectedSemesterId} 
            onValueChange={(value) => {
              setSelectedSemesterId(value);
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả học kỳ</SelectItem>
              {semestersByYear.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Trạng thái */}
          <Select value={statusFilter} onValueChange={(value: "all" | "proposed") => {
            setStatusFilter(value);
            setPage(1);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="proposed">Có đề xuất cảnh cáo - thôi học</SelectItem>
              <SelectItem value="all">Tất cả</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Ngành (chỉ để filter danh sách lớp) */}
          <Select 
            value={selectedMajorId} 
            onValueChange={async (value) => {
              setSelectedMajorId(value);
              setClassroom(""); 
              setPage(1);
              // Load classes theo ngành
              if (value && value !== "all") {
                try {
                  const controller = new AbortController();
                  const classes = await api.fetchClassesByMajor(Number(value), controller.signal);
                  setClassesData(classes);
                } catch {
                  setClassesData([]);
                }
              } else {
                setClassesData([]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn ngành" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả ngành</SelectItem>
              {majorsData.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Lớp */}
          <Select 
            value={classroom} 
            onValueChange={(value) => {
              setClassroom(value);
              setPage(1);
            }}
            disabled={!selectedMajorId || selectedMajorId === "all" || classesData.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                !selectedMajorId || selectedMajorId === "all" 
                  ? "Chọn ngành trước" 
                  : classesData.length === 0 
                    ? "Ngành này không có lớp"
                    : "Chọn lớp"
              } />
            </SelectTrigger>
            <SelectContent>
              {classesData.length > 0 && (
                <SelectItem value="all">Tất cả lớp</SelectItem>
              )}
              {classesData.map((c) => (
                <SelectItem key={c.id} value={c.class_code}>
                  {c.class_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tên hoặc MSSV */}
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Tìm theo tên hoặc MSSV..." 
              value={searchText} 
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  fetchData({ p: 1 });
                }
              }}
            />
            {searchText && (
              <Button variant="ghost" size="icon" onClick={() => {
                setSearchText("");
                setPage(1);
              }}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Nút tìm kiếm ở hàng riêng, căn phải */}
        <div className="flex justify-end">
          <Button 
            className="w-auto" 
            onClick={() => { 
              setPage(1); 
              fetchData({ p: 1 }); 
            }} 
            disabled={loading || (!!selectedMajorId && selectedMajorId !== "all" && classesData.length === 0)}
          >
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </Button>
        </div>
       </div>

      <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
        <DataTable
          headers={[
            "Mã sinh viên",
            "Họ và tên",
            "Lớp học",
            "Năm học",
            "Học kỳ",
            "Số thứ tự HK",
            "Năm học",
            "Điểm TB học kỳ (4)",
            "Điểm TBTL (4)",
            "Ngưỡng ĐTBHL",
            "Ngưỡng ĐTBHTL",
            "Tín chỉ không đạt",
            "Rớt >50% tín chỉ",
            "Nợ >24 tín chỉ",
            "ĐTBHL dưới ngưỡng",
            "ĐTBHTL dưới ngưỡng",
            "Tín chỉ nợ lũy kế",
            "Số lần cảnh cáo",
            "Cảnh cáo liên tiếp",
            "Mức cảnh cáo đề xuất",
            "Nguy cơ buộc thôi học",
            "Lý do vi phạm",
            "Lý do buộc thôi học",
            "Thao tác",
          ]}
        >
          {error && (
            <tr>
              <td className="px-4 py-6 text-red-600" colSpan={24}>
                {error}
              </td>
            </tr>
          )}
          {!error && rows.length === 0 && !loading && (
            <tr>
              <td className="px-4 py-8 text-center text-muted-foreground" colSpan={24}>
                <p>Không có dữ liệu cảnh cáo cho học kỳ hiện tại.</p>
              </td>
            </tr>
          )}
          {!error && loading && (
            <tr>
              <td className="px-4 py-8 text-center text-muted-foreground" colSpan={24}>
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
                  <td className="px-4 py-3 border-b">{r.semester_number ?? "-"}</td>
                  <td className="px-4 py-3 border-b">{r.year_of_study ? `Năm ${r.year_of_study}` : "-"}</td>
                  <td className="px-4 py-3 border-b font-medium">{r.avg_score_4 ?? "-"}</td>
                  <td className="px-4 py-3 border-b font-medium">{r.cum_avg_score_4 ?? "-"}</td>
                  <td className="px-4 py-3 border-b">{r.semester_gpa_threshold ?? "-"}</td>
                  <td className="px-4 py-3 border-b">{r.cumulative_gpa_threshold ?? "-"}</td>
                  <td className="px-4 py-3 border-b text-red-600">{r.total_credit_failed ?? "-"}</td>
                  <td className="px-4 py-3 border-b">{r.failed_over_50 ? "Có" : "Không"}</td>
                  <td className="px-4 py-3 border-b">{r.cumulative_failed_over_24 ? "Có" : "Không"}</td>
                  <td className="px-4 py-3 border-b">{r.semester_gpa_below_threshold ? "Có" : "Không"}</td>
                  <td className="px-4 py-3 border-b">{r.cumulative_gpa_below_threshold ? "Có" : "Không"}</td>
                  <td className="px-4 py-3 border-b">{r.total_credit_failed_cumulative ?? "-"}</td>
                  <td className="px-4 py-3 border-b">{r.previous_warnings_count}</td>
                  <td className="px-4 py-3 border-b">{r.consecutive_warnings_count}</td>
                  <td className="px-4 py-3 border-b">{translateWarningLevel(r.proposed_warning_level) ?? "-"}</td>
                  <td className="px-4 py-3 border-b">{r.expulsion_candidate ? "Có" : "Không"}</td>
                  <td className="px-4 py-3 border-b whitespace-pre-wrap text-sm">{Array.isArray(r.violation_reasons) && r.violation_reasons.length > 0 ? r.violation_reasons.join("\n") : "-"}</td>
                  <td className="px-4 py-3 border-b whitespace-pre-wrap text-sm text-red-600">{Array.isArray(r.expulsion_reasons) && r.expulsion_reasons.length > 0 ? r.expulsion_reasons.join("\n") : "-"}</td>
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

      <WarningSummaryStats rows={rows} />
      <WarningDistributionChart rows={rows} />

      {/* Warning History Modal */}
      <WarningHistoryModal
        open={warningOpen}
        onClose={() => setWarningOpen(false)}
        studentId={selectedStudentId || undefined}
        semesterId={currentSemesterId ? String(currentSemesterId) : undefined}
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
