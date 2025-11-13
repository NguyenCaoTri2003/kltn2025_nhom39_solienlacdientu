"use client";

import React, { useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Grade } from "@packages/core/entities/Grade";
import {
  CircleCheck,
  CircleX,
  Search,
  X,
  Loader2,
  FileDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/pagination";
import { normalize } from "@/utils/normalize";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import * as XLSX from "xlsx";
import { getClassificationLabel } from "./get-classification-label";

interface GradeSummaryInfo {
  total_score?: number | null;
  gpa4?: number | null;
  letter_grade?: string | null;
  classification?: string | null;
  passed?: boolean | null;
  note?: string | null;
}

interface GradeRow {
  student_id?: number;
  student_code?: string;
  student_name?: string;
  practice_group_number?: number | null;
  theoryScores?: Grade[] | null;
  practiceScores?: Grade[] | null;
  summary?: GradeSummaryInfo | null;
}

interface GradeTableCardProps {
  grades: any[];
  pageSize?: number;
  offeringName?: string;
}

export function GradeTableCard({
  grades = [],
  pageSize = 10,
  offeringName,
}: GradeTableCardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | passed | failed
  const [groupFilter, setGroupFilter] = useState("all"); // nhóm thực hành
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => {
      setQuery(searchTerm);
      setIsLoading(false);
      setCurrentPage(1);
    }, 500);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setQuery("");
  };

  const exportToExcel = () => {
    if (!grades.length) return;

    const exportData = grades.map((s) => ({
      "Mã sinh viên": s.student_code,
      "Tên sinh viên": s.student_name,
      "Nhóm thực hành": s.practice_group_number ?? "",
      "Thường xuyên": s.theoryScores
        ?.filter((g: Grade) => g.type === "regular")
        .map((g: Grade) => g.score)
        .join(", ") ?? "",
      "Thực hành": s.practiceScores?.map((g: Grade) => g.score).join(", ") ?? "",
      "Giữa kỳ":
        s.theoryScores?.find((g: Grade) => g.type === "midterm")?.score ?? "",
      "Cuối kỳ":
        s.theoryScores?.find((g: Grade) => g.type === "final")?.score ?? "",
      "Tổng kết": s.summary?.total_score ?? "",
      "Thang 4": s.summary?.gpa4 ?? "",
      "Điểm chữ": s.summary?.letter_grade ?? "",
      "Xếp loại": getClassificationLabel(s.summary?.classification ?? undefined) ?? "",
      "Đạt":
        s.summary?.passed === true
          ? "Đạt"
          : s.summary?.passed === false
          ? "Không đạt"
          : "",
      "Ghi chú": s.summary?.note ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "BangDiem");
    XLSX.writeFile(workbook, `Bảng điểm lớp ${offeringName}${Date.now()}.xlsx`);
  };

  const practiceGroups = useMemo(() => {
    const unique = Array.from(
      new Set(
        grades
          .map((s) => s.practice_group_number)
          .filter((num): num is number => typeof num === "number")
      )
    );
    return unique.sort((a, b) => a - b);
  }, [grades]);

  // Lọc và sắp xếp dữ liệu
  const filteredGrades = useMemo(() => {
    let data = grades;

    if (query) {
      const normalizedQuery = normalize(query);
      data = data.filter((s) => {
        const combined = normalize(`${s.student_name} ${s.student_code}`);
        return combined.includes(normalizedQuery);
      });
    }

    if (filter !== "all") {
      data = data.filter((s) =>
        filter === "passed"
          ? s.summary?.passed === true
          : s.summary?.passed === false
      );
    }

    if (groupFilter !== "all") {
      data = data.filter(
        (s) => String(s.practice_group_number) === groupFilter
      );
    }

    return [...data].sort((a, b) => {
      const nameA = (a.student_name ?? "").trim().split(" ").slice(-1)[0] || "";
      const nameB = (b.student_name ?? "").trim().split(" ").slice(-1)[0] || "";
      return nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
    });
  }, [grades, query, filter, groupFilter]);

  const totalItems = filteredGrades.length;
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredGrades.slice(startIndex, startIndex + pageSize);
  }, [filteredGrades, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      {/* Thanh công cụ */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Ô tìm kiếm */}
        <div className="relative w-full sm:max-w-[260px]">
          <Input
            placeholder="Tìm theo tên hoặc mã sinh viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button onClick={handleSearch}>
          <Search className="w-4 h-4 mr-2" />
          Tìm kiếm
        </Button>

        {query && (
          <Button variant="destructive" onClick={clearSearch}>
            Xóa tìm kiếm
          </Button>
        )}

        {/* Bộ lọc Đạt / Không đạt */}
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Lọc kết quả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="passed">Đạt</SelectItem>
            <SelectItem value="failed">Không đạt</SelectItem>
          </SelectContent>
        </Select>

        {/* Bộ lọc nhóm thực hành */}
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Nhóm thực hành" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả nhóm</SelectItem>
            {practiceGroups.map((g) => (
              <SelectItem key={g} value={String(g)}>
                Nhóm {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Xuất Excel */}
        <Button
          variant="outline"
          onClick={exportToExcel}
          className="ml-auto flex items-center"
          disabled={!grades.length}
        >
          <FileDown className="w-4 h-4 mr-2" />
          Xuất Excel
        </Button>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto w-full rounded-lg border border-border/40 min-h-[200px] relative">
        <Table className="w-max min-w-full border-collapse text-sm">
          <TableHeader className="bg-muted/40 sticky top-0 z-10">
            <TableRow>
              <TableHead rowSpan={2} className="text-center w-48">
                Sinh viên
              </TableHead>
              <TableHead rowSpan={2}>Nhóm TH</TableHead>
              <TableHead colSpan={9} className="text-center">
                Thường xuyên
              </TableHead>
              <TableHead colSpan={5} className="text-center">
                Thực hành
              </TableHead>
              <TableHead rowSpan={2}>Giữa kỳ</TableHead>
              <TableHead rowSpan={2}>Cuối kỳ</TableHead>
              <TableHead rowSpan={2}>Tổng kết</TableHead>
              <TableHead rowSpan={2}>Thang 4</TableHead>
              <TableHead rowSpan={2}>Điểm chữ</TableHead>
              <TableHead rowSpan={2}>Xếp loại</TableHead>
              <TableHead rowSpan={2}>Đạt</TableHead>
              <TableHead rowSpan={2}>Ghi chú</TableHead>
            </TableRow>
            <TableRow>
              {Array.from({ length: 9 }, (_, i) => (
                <TableHead key={`ts-${i}`} className="text-center">
                  {i + 1}
                </TableHead>
              ))}
              {Array.from({ length: 5 }, (_, i) => (
                <TableHead key={`th-${i}`} className="text-center">
                  {i + 1}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={21} className="text-center py-10">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    <span>Đang tìm kiếm...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={21}
                  className="text-center text-muted-foreground py-6"
                >
                  Không có dữ liệu phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((student) => (
                <TableRow
                  key={student.student_id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium whitespace-nowrap text-foreground">
                    {student.student_name}
                    <span className="text-muted-foreground text-xs block">
                      {student.student_code}
                    </span>
                  </TableCell>

                  <TableCell className="text-center">
                    {student.practice_group_number ?? "-"}
                  </TableCell>

                  {Array.from({ length: 9 }, (_, i) => (
                    <TableCell
                      key={`reg-${student.student_id}-${i}`}
                      className="text-center"
                    >
                      {student.theoryScores?.filter(
                        (g: Grade) => g.type === "regular"
                      )[i]?.score ?? "-"}
                    </TableCell>
                  ))}

                  {Array.from({ length: 5 }, (_, i) => (
                    <TableCell
                      key={`prac-${student.student_id}-${i}`}
                      className="text-center"
                    >
                      {student.practiceScores?.[i]?.score ?? "-"}
                    </TableCell>
                  ))}

                  <TableCell className="text-center">
                    {
                      student.theoryScores?.find(
                        (g: Grade) => g.type === "midterm"
                      )?.score ?? "-"
                    }
                  </TableCell>

                  <TableCell className="text-center">
                    {
                      student.theoryScores?.find(
                        (g: Grade) => g.type === "final"
                      )?.score ?? "-"
                    }
                  </TableCell>

                  <TableCell className="text-center font-medium">
                    {student.summary?.total_score ?? "-"}
                  </TableCell>

                  <TableCell className="text-center">
                    {student.summary?.gpa4 ?? "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {student.summary?.letter_grade ?? "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {getClassificationLabel(student.summary?.classification ?? undefined)}
                  </TableCell>

                  <TableCell className="text-center">
                    {student.summary?.passed === true ? (
                      <CircleCheck className="mx-auto h-4 w-4 text-green-500" />
                    ) : student.summary?.passed === false ? (
                      <CircleX className="mx-auto h-4 w-4 text-red-500" />
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  <TableCell className="text-center italic text-muted-foreground">
                    {student.summary?.note ?? "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!isLoading && currentData.length > 0 && (
          <Pagination
            totalItems={totalItems}
            pageSize={pageSize}
            currentPage={currentPage}
            onChange={setCurrentPage}
            item="sinh viên"
          />
        )}
      </div>
    </div>
  );
}
