"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Users,
  CalendarDays,
  BookOpen,
  Info,
  Search,
  X,
  BookText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import WeeklyScheduleList from "../classes/weekly-schedule-list";
import SemesterSelector from "@/components/lecturer/classes/semester-selector";
import { Semester } from "@packages/core/entities/Semesters";
import { Input } from "@/components/ui/input";
import CourseOfferingSkeleton from "@/components/skeleton/course-offering-skeleton";
import Pagination from "@/components/pagination";
import { Offering } from "@packages/core/entities/CourseOffering";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/empty-state";

export default function HomeroomClassesList() {
  const [classes, setClasses] = useState<Offering[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const topRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!selectedSemester?.id) return;

    const fetchOfferings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/classes/homeroom?semester_id=${selectedSemester.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const json = await res.json();
        setClasses(json.returnCode === 0 ? json.data : []);
      } catch (error) {
        console.error("Error fetching classes:", error);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, [selectedSemester]);

  useEffect(() => {
    setPage(1);
  }, [selectedSemester?.id, searchTerm]);

  function normalizeText(str: string) {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  const filteredOfferings = useMemo(() => {
    const term = normalizeText(searchTerm);
    if (!term) return classes;
    return classes.filter((o) => {
      const name = normalizeText(o.name || "");
      const classCode = normalizeText(o.class_code || "");
      const courseCode = normalizeText(o.courses?.course_code || "");
      return name.includes(term) || classCode.includes(term) || courseCode.includes(term);
    });
  }, [classes, searchTerm]);

  const totalItems = filteredOfferings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const pagedOfferings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOfferings.slice(start, start + pageSize);
  }, [filteredOfferings, page]);

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setPage(clamped);
    if (topRef.current) topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />
      <div className="space-y-10 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="relative w-full sm:w-[420px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />

            <Input
              placeholder="Tìm kiếm theo tên học phần, mã lớp hoặc mã học phần"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-10 h-11 rounded-full border border-border/50 bg-background/80 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.6)] backdrop-blur focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/40"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="w-full sm:w-auto">
            <SemesterSelector
              onChange={setSelectedSemester}
              className="min-w-[240px] rounded-full border border-border/50 bg-background/60 shadow-[0_12px_32px_-20px_rgba(15,23,42,0.6)] backdrop-blur"
            />
          </div>
        </div>

        {loading ? (
          <CourseOfferingSkeleton items={6} />
        ) : filteredOfferings.length === 0 ? (
          <EmptyState
            icon={<BookText className="w-10 h-10" />}
            text="Không có lớp học phần nào phù hợp"
          />
        ) : (
          <section ref={topRef} className="space-y-6">
            {selectedSemester && (
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 shadow-inner shadow-black/5 backdrop-blur-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {selectedSemester.name}{" "}
                    {selectedSemester.academic_year ? `(${selectedSemester.academic_year})` : ""}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Danh sách lớp học phần trong học kỳ được phân công
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {pagedOfferings.map((o) => (
                <motion.div
                  key={o.id}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="h-full"
                >
                  <Card
                    className="group h-full flex flex-col justify-between rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/60 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)] ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_28px_90px_-50px_rgba(59,130,246,0.75)] hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer overflow-hidden"
                    onClick={() => router.push(`/lecturer/classes/${o.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <h3 className="font-semibold text-foreground text-base line-clamp-1 leading-tight">
                          {o.name}
                        </h3>

                        {o.is_practice_lecturer ? (
                          <span className="text-xs font-medium uppercase tracking-wide text-primary/80">
                            Nhóm thực hành
                          </span>
                        ) : o.practice_group_count > 0 ? (
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Có {o.practice_group_count} nhóm thực hành
                          </span>
                        ) : (
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Lớp lý thuyết
                          </span>
                        )}
                      </div>

                      {o.is_practice_lecturer && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shadow-inner">
                          Thực hành
                        </span>
                      )}
                    </div>

                    {o.is_practice_lecturer ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Nhóm thực hành số {o.practice_group_number}
                      </p>
                    ) : (
                      <div className="h-5" />
                    )}

                    <div className="mt-3 space-y-1.5 rounded-2xl border border-dashed border-border/50 bg-muted/20 px-4 py-3 text-sm text-muted-foreground dark:border-border/40 dark:bg-muted/10">
                      <p>
                        Mã lớp học phần:{" "}
                        <span className="font-medium text-foreground">{o.class_code}</span>
                      </p>
                      {o.courses?.course_code && (
                        <p>
                          Mã học phần:{" "}
                          <span className="font-medium text-foreground">{o.courses.course_code}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex-1 rounded-2xl border border-border/40 bg-background/60 px-4 py-3">
                      <WeeklyScheduleList
                        schedules={o.weekly_schedules}
                        filterType={o.is_practice_lecturer ? "practice" : "theory"}
                        semester={o.semesters ?? undefined}
                        practiceGroupNumber={o.practice_group_number ?? undefined}
                      />
                    </div>

                    <div className="mt-4 flex justify-between text-sm text-muted-foreground border-t border-border/40 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <GraduationCap className="w-4 h-4" />
                        </span>
                        <span className="font-semibold text-foreground">
                          {o.courses?.credit || "-"} tín chỉ
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                          <Users className="w-4 h-4" />
                        </span>
                        <span className="font-semibold text-foreground">
                          {o.registered || 0}/{o.capacity || 0} SV
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
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



