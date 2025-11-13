"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useUser } from "@/context/user-context";
import { useCourseOfferings } from "@/hooks/useCourseOfferings";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Book, Search, X, BookOpen, CalendarDays, GraduationCap, BookText } from "lucide-react";
import { useRouter } from "next/navigation";
import Pagination from "@/components/pagination";
import EmptyState from "@/components/empty-state";
import CourseOfferingSkeleton from "@/components/skeleton/course-offering-skeleton";
import SemesterSelector from "@/components/lecturer/classes/semester-selector";
import { Semester } from "@packages/core/entities/Semesters";

const DAY_NAMES = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

export default function OfferingsList() {
  const router = useRouter();
  const { userData } = useUser();

  const isParent = userData?.role === "parent";
  const children = userData?.children || [];
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const activeChild = isParent ? children[selectedChildIndex] : null;

  const studentId = isParent ? activeChild?.id : userData?.student?.id;
  const studentYear = isParent
    ? activeChild?.academic_year
    : userData?.student?.academic_year;

  const {
    semester,
    setSemester,
    offerings,
    loading,
    error,
    loadOfferingsBySemester,
  } = useCourseOfferings(studentYear, studentId);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 12;
  const topRef = useRef<HTMLDivElement | null>(null);

  const handleSelectSemester = useCallback(async (semester: Semester | null) => {
    if (semester) {
      setSemester(semester);
      await loadOfferingsBySemester(semester.id);
      setPage(1);
    }
  }, [setSemester, loadOfferingsBySemester]);

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    setSearchTerm(searchInput.trim());
    setPage(1);
  };

  function normalizeText(str: string) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  const filteredOfferings = useMemo(() => {
    const term = normalizeText(searchTerm);
    if (!term) return offerings;
    return offerings.filter((item) => {
      const name = normalizeText(item.name || "");
      const classCode = normalizeText(item.class_code || "");
      return name.includes(term) || classCode.includes(term);
    });
  }, [offerings, searchTerm]);

  const totalItems = filteredOfferings.length;
  const paginatedOfferings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOfferings.slice(start, start + pageSize);
  }, [filteredOfferings, page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (topRef.current) topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
      <div className="space-y-10 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        {/* Tabs chọn con (nếu là phụ huynh) */}
        {isParent && children.length > 1 && (
          <div className="flex gap-2 flex-wrap rounded-2xl border border-border/40 bg-muted/30 p-3">
            {children.map((child: { id: number; users?: { full_name?: string } }, index: number) => (
              <button
                key={child.id}
                className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  selectedChildIndex === index
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background/60 text-foreground hover:bg-muted"
                }`}
                onClick={() => setSelectedChildIndex(index)}
              >
                {child.users?.full_name || `Con ${index + 1}`}
              </button>
            ))}
          </div>
        )}

        {/* Chọn học kỳ + Tìm kiếm */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="relative w-full sm:w-[420px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên học phần, mã lớp hoặc mã học phần"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 pr-10 h-11 rounded-full border border-border/50 bg-background/80 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.6)] backdrop-blur focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/40"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="w-full sm:w-auto">
            <SemesterSelector
              onChange={handleSelectSemester}
              className="min-w-[240px] rounded-full border border-border/50 bg-background/60 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.6)] backdrop-blur"
            />
          </div>
        </div>

        {loading ? (
          <CourseOfferingSkeleton items={6} />
        ) : error ? (
          <EmptyState
            icon={<Book className="w-10 h-10" />}
            text={error}
            className="py-1"
          />
        ) : filteredOfferings.length === 0 ? (
          <EmptyState
            icon={<BookText className="w-10 h-10" />}
            text="Không có lớp học phần nào phù hợp"
          />
        ) : (
          <section ref={topRef} className="space-y-6">
            {semester && (
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 shadow-inner shadow-black/5 backdrop-blur-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {semester.name}{" "}
                    {semester.academic_year ? `(${semester.academic_year})` : ""}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Danh sách lớp học phần đã đăng ký
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {paginatedOfferings.map((item) => {
                const theory = item.detail?.schedule?.[0];
                const practice = item.detail?.practice_group?.schedule?.[0];
                const hasPractice = !!item.detail?.practice_group;

                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -6 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="h-full"
                  >
                    <Card
                      className="group h-full flex flex-col justify-between rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/60 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)] ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_28px_90px_-50px_rgba(59,130,246,0.75)] hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer overflow-hidden"
                      onClick={() => router.push(`/portal/classes/${item.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <h3 className="font-semibold text-foreground text-base line-clamp-1 leading-tight">
                            {item.name}
                          </h3>
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {hasPractice ? "Có thực hành" : "Lớp lý thuyết"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 rounded-2xl border border-dashed border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                        <p>
                          Mã lớp học phần:{" "}
                          <span className="font-medium text-foreground">{item.class_code}</span>
                        </p>
                      </div>

                      <div className="mt-3 flex-1 rounded-2xl border border-border/40 bg-background/60 px-4 py-3">
                        <div className="space-y-2">
                          {/* Lý thuyết */}
                          <div className="space-y-1">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Lý thuyết
                            </h4>
                            <p className="text-sm text-foreground">
                              GV: {item.detail?.lecturer?.full_name ?? "—"}
                            </p>
                            {theory && (
                              <p className="text-xs text-muted-foreground">
                                {DAY_NAMES[theory.day_of_week]} • Tiết {theory.start_period} -{" "}
                                {theory.start_period + theory.period_count - 1} • Phòng{" "}
                                {theory.classroom}
                              </p>
                            )}
                          </div>

                          {/* Thực hành */}
                          {hasPractice && (
                            <div className="space-y-1 pt-2 border-t border-border/30">
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                Thực hành
                              </h4>
                              <p className="text-sm text-foreground">
                                GV: {item.detail?.practice_group?.lecturer?.full_name ?? "—"}
                              </p>
                              {practice && (
                                <p className="text-xs text-muted-foreground">
                                  {DAY_NAMES[practice.day_of_week]} • Tiết {practice.start_period} -{" "}
                                  {practice.start_period + practice.period_count - 1} • Phòng{" "}
                                  {practice.classroom}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex justify-between text-sm text-muted-foreground border-t border-border/40 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <GraduationCap className="w-4 h-4" />
                          </span>
                          <span className="font-semibold text-foreground">
                            {item.courses?.credit || "-"} tín chỉ
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <Pagination
              totalItems={totalItems}
              pageSize={pageSize}
              currentPage={page}
              onChange={handlePageChange}
              item="lớp học phần"
            />
          </section>
        )}
      </div>
    </div>
  );
}
