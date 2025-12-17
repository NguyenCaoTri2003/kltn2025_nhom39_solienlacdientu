"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Users,
  BookOpen,
  Search,
  X,
  BookText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import WeeklyScheduleList from "../classes/weekly-schedule-list";
import { Input } from "@/components/ui/input";
import CourseOfferingSkeleton from "@/components/skeleton/course-offering-skeleton";
import Pagination from "@/components/pagination";
import { Class } from "@packages/core/entities/Classes";
import { useRouter } from "next/navigation";
import EmptyState from "@/components/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CURRENT_YEAR = "CURRENT";
const ALL_YEARS = "ALL";

export default function HomeroomClassesList() {

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(CURRENT_YEAR);

  const [page, setPage] = useState(1);
  const pageSize = 12;

  const topRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/classes/homeroom`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const json = await res.json();

        console.log("Homeroom classes fetched:", json.data);
        setClasses(json.returnCode === 0 ? json.data : []);
      } catch (err) {
        console.error("Fetch homeroom classes error:", err);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const normalizeText = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const parseAcademicYearRange = (academicYear?: string) => {
    if (!academicYear) return null;

    const normalized = academicYear
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, "");

    const parts = normalized.split("-");
    if (parts.length !== 2) return null;

    const startYear = parseInt(parts[0], 10);
    const endYear = parseInt(parts[1], 10);

    if (isNaN(startYear) || isNaN(endYear)) return null;

    return { startYear, endYear };
  };

  const academicYears = useMemo(() => {
    return Array.from(
      new Set(classes.map((c) => c.academic_year).filter(Boolean))
    ).sort().reverse() as string[];
  }, [classes]);

  const filteredOfferings = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const term = normalizeText(searchTerm);

    let data = classes;

    if (selectedAcademicYear === CURRENT_YEAR) {
      data = data.filter((c) => {
        const range = parseAcademicYearRange(c.academic_year ?? undefined);
        return (
          range &&
          range.startYear <= currentYear &&
          currentYear <= range.endYear
        );
      });
    }

    if (selectedAcademicYear === ALL_YEARS) {
      data = data;
    }

    if (
      selectedAcademicYear !== CURRENT_YEAR &&
      selectedAcademicYear !== ALL_YEARS
    ) {
      data = data.filter(
        (c) => c.academic_year === selectedAcademicYear
      );
    }

    if (term) {
      data = data.filter((o) =>
        normalizeText(o.name || "").includes(term) ||
        normalizeText(o.class_code || "").includes(term) 
      );
    }

    return data;
  }, [classes, searchTerm, selectedAcademicYear]);


  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedAcademicYear]);

  const totalItems = filteredOfferings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const pagedClasses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOfferings.slice(start, start + pageSize);
  }, [filteredOfferings, page]);

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setPage(clamped);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.12),rgba(59,130,246,0)_60%)] blur-[1px]" />

      <div className="space-y-10 rounded-3xl border border-border/60 bg-card/50 p-6 sm:p-10 backdrop-blur-xl">

        <div className="flex flex-wrap gap-4 justify-between">
          <div className="relative w-full sm:w-[420px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên học phần, mã lớp hoặc mã học phần"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-10 h-11 rounded-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 h-6 w-6 rounded-full bg-muted/60 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <Select
              value={selectedAcademicYear}
              onValueChange={setSelectedAcademicYear}
            >
              <SelectTrigger className="h-11 min-w-[220px] rounded-full">
                <SelectValue placeholder="Chọn niên khóa" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value={CURRENT_YEAR}>
                  Niên khóa hiện tại
                </SelectItem>

                <SelectItem value={ALL_YEARS}>
                  Tất cả niên khóa
                </SelectItem>

                {academicYears.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pagedClasses.map((c) => (
                <motion.div
                  key={c.id}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Card
                    className="group h-full flex flex-col justify-between rounded-3xl border border-border/60
                      bg-gradient-to-br from-card/95 via-card/90 to-background/60
                      p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.55)]
                      ring-1 ring-transparent transition-all duration-300
                      hover:-translate-y-1 hover:border-primary/50
                      hover:shadow-[0_28px_90px_-50px_rgba(59,130,246,0.75)]
                      hover:ring-primary/40 cursor-pointer overflow-hidden"
                    onClick={() => router.push(`/lecturer/homeroom-classes/${c.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
                    bg-primary/15 text-primary">
                        <BookOpen className="w-5 h-5" />
                      </div>

                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-foreground text-base leading-snug line-clamp-2">
                          {c.name}
                        </h3>

                        <p className="text-sm text-muted-foreground">
                          Mã lớp:{" "}
                          <span className="font-medium text-foreground">
                            {c.class_code}
                          </span>
                        </p>
                      </div>
                    </div>

                    {(c.major || c.class_type) && (
                      <div className="mt-4 space-y-1.5 text-sm">
                        {c.major && (
                          <p className="text-muted-foreground">
                            Ngành:{" "}
                            <span className="font-medium text-foreground">
                              {c.major.name}
                            </span>
                          </p>
                        )}

                        {c.major?.faculty && (
                          <p className="text-muted-foreground">
                            Khoa:{" "}
                            <span className="font-medium text-foreground">
                              {c.major.faculty.name}
                            </span>
                          </p>
                        )}

                        {c.class_type && (
                          <p className="text-muted-foreground">
                            Loại lớp:{" "}
                            <span className="font-medium text-foreground capitalize">
                              {c.class_type === "regular" ? "Chính quy" : "Tiên tiến"}
                            </span>
                          </p>
                        )}
                      </div>
                    )}

                    {c.academic_year && (
                      <div className="mt-5 rounded-xl border border-dashed border-border/50 bg-muted/20 px-4 py-2 text-sm flex items-center justify-between">
                        <span className="text-muted-foreground">Niên khóa</span>
                        <span className="font-semibold text-foreground">
                          {c.academic_year}
                        </span>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>

            <Pagination
              totalItems={totalItems}
              pageSize={pageSize}
              currentPage={page}
              onChange={handlePageChange}
              item="lớp chủ nhiệm"
            />
          </section>
        )}
      </div>
    </div>
  );
}
