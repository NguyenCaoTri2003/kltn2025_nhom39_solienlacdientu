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
} from "lucide-react";
import { Card } from "@/components/ui/card";
import WeeklyScheduleList from "./weekly-schedule-list";
import SemesterSelector from "@/components/lecturer/classes/semester-selector";
import { Semester } from "@packages/core/entities/Semesters";
import { Input } from "@/components/ui/input";
import CourseOfferingSkeleton from "@/components/skeleton/course-offering-skeleton";
import Pagination from "@/components/pagination";
import { Offering } from "@packages/core/entities/CourseOffering";
import { useRouter } from "next/navigation";

export default function OfferingsList() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
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
          `${process.env.NEXT_PUBLIC_API_URL}/api/offerings/lecturer?semester_id=${selectedSemester.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const json = await res.json();
        setOfferings(json.returnCode === 0 ? json.data : []);
      } catch (error) {
        console.error("Error fetching offerings:", error);
        setOfferings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferings();
  }, [selectedSemester]);

  console.log("Offerings:", offerings);

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
    if (!term) return offerings;
    return offerings.filter((o) => {
      const name = normalizeText(o.name || "");
      const classCode = normalizeText(o.class_code || "");
      const courseCode = normalizeText(o.courses?.course_code || "");
      return name.includes(term) || classCode.includes(term) || courseCode.includes(term);
    });
  }, [offerings, searchTerm]);

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
    <div className="space-y-10">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:w-[420px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

          <Input
            placeholder="Tìm kiếm theo tên học phần, mã lớp hoặc mã học phần"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <SemesterSelector onChange={setSelectedSemester} />
      </div>

      {loading ? (
        <CourseOfferingSkeleton items={6} />
      ) : filteredOfferings.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          Không có lớp học phần nào trong học kỳ này.
        </div>
      ) : (
        <section ref={topRef}>
          {selectedSemester && (
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                {selectedSemester.name}{" "}
                {selectedSemester.academic_year ? `(${selectedSemester.academic_year})` : ""}
              </h2>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {pagedOfferings.map((o) => (
              <motion.div
                key={o.id}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="h-full"
              >
                <Card
                  className="h-full flex flex-col justify-between p-5 rounded-2xl border border-border/50
                  bg-gradient-to-br from-card/95 to-card/70 shadow-md hover:shadow-xl 
                  transition-all backdrop-blur-sm cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/lecturer/classes/${o.id}`)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground text-base line-clamp-1 leading-tight">
                      {o.name}
                    </h3>

                    {o.is_practice_lecturer && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        Thực hành
                      </span>
                    )}
                  </div>

                  {o.is_practice_lecturer ? (
                    <p className="text-xs text-muted-foreground ml-6 mb-1">
                      (Nhóm thực hành số {o.practice_group_number})
                    </p>
                  ) : o.practice_group_count > 0 ? (
                    <p className="text-xs text-muted-foreground ml-6 mb-1">
                      ({o.practice_group_count} nhóm thực hành)
                    </p>
                  ) : (
                    <div className="h-3.5 mb-1" />
                  )}

                  <div className="space-y-0.5 mb-2">
                    <p className="text-sm text-muted-foreground">
                      Mã lớp học phần:{" "}
                      <span className="font-medium text-foreground">{o.class_code}</span>
                    </p>
                    {o.courses?.course_code && (
                      <p className="text-sm text-muted-foreground">
                        Mã học phần:{" "}
                        <span className="font-medium text-foreground">
                          {o.courses.course_code}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex-1 mb-2 min-h-[2.5rem]">
                    <WeeklyScheduleList
                      schedules={o.weekly_schedules}
                      filterType={o.is_practice_lecturer ? "practice" : "theory"}
                      semester={o.semesters ?? undefined}
                      practiceGroupNumber={o.practice_group_number ?? undefined}
                    />
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground border-t border-border/40 pt-2 mt-auto">
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      {o.courses?.credit || "-"} tín chỉ
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-primary" />
                      {o.registered || 0}/{o.capacity || 0} SV
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
          />
        </section>
      )}
    </div>
  );
}
