"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search, CircleCheck, CircleX, Loader2 } from "lucide-react";
import Pagination from "@/components/pagination";
import { Grade } from "@packages/core/entities/Grade";
import { normalize } from "@/utils/normalize";

interface GradeTableCardProps {
  grades: any[];
  title?: string;
  pageSize?: number;
}

export function GradeTableCard({
  grades = [],
  title = "Bảng điểm chi tiết của lớp học phần",
  pageSize = 10,
}: GradeTableCardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const getLastName = (fullName?: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1];
  };

  const sortedGrades = useMemo(() => {
    return [...grades].sort((a, b) =>
      getLastName(a.student_name).localeCompare(getLastName(b.student_name), "vi", {
        sensitivity: "base",
      })
    );
  }, [grades]);

  const filteredGrades = useMemo(() => {
    let data = sortedGrades;
    if (query) {
      const normalizedQuery = normalize(query);
      data = data.filter((s) => {
        const combined = [s.student_code, s.student_name]
          .filter(Boolean)
          .map((v) => normalize(v as string))
          .join(" ");
        return combined.includes(normalizedQuery);
      });
    }
    return data;
  }, [sortedGrades, query]);

  const totalItems = filteredGrades.length;
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredGrades.slice(startIndex, startIndex + pageSize);
  }, [filteredGrades, currentPage, pageSize]);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-lg">{title}</h2>

        <div className="flex items-center gap-2">
          <div className="relative w-[420px] sm:w-[480px]">
            <Input
              placeholder="Tìm theo MSSV hoặc tên sinh viên..."
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
            <Search className="w-4 h-4 mr-2" /> Tìm kiếm
          </Button>

          {query && (
            <Button variant="destructive" onClick={clearSearch}>
              Xóa tìm
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto w-full rounded-lg border border-border/40 min-h-[200px]">
        <Table className="w-max min-w-full border-collapse text-sm">
          <TableHeader className="bg-muted/40 sticky top-0 z-10">
            <TableRow>
              <TableHead rowSpan={2} className="text-center w-48">
                Sinh viên
              </TableHead>
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

          {/* Body */}
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={22} className="text-center py-10">
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    <span>Đang tìm kiếm...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={22}
                  className="text-center text-muted-foreground py-6"
                >
                  {query
                    ? "Không tìm thấy sinh viên phù hợp."
                    : "Chưa có dữ liệu điểm."}
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((student) => (
                <TableRow
                  key={student.student_id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  {/* Sinh viên */}
                  <TableCell className="font-medium whitespace-nowrap text-foreground">
                    <div className="flex flex-col">
                      <span>{student.student_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {student.student_code}
                      </span>
                    </div>
                  </TableCell>

                  {Array.from({ length: 9 }, (_, i) => (
                    <TableCell key={`reg-${student.student_id}-${i}`} className="text-center">
                      {student.theoryScores?.filter((g: Grade) => g.type === "regular")[i]?.score ?? "-"}
                    </TableCell>
                  ))}

                  {Array.from({ length: 5 }, (_, i) => (
                    <TableCell key={`prac-${student.student_id}-${i}`} className="text-center">
                      {student.practiceScores?.[i]?.score ?? "-"}
                    </TableCell>
                  ))}

                  <TableCell className="text-center">
                    {student.theoryScores?.find((g: Grade) => g.type === "midterm")?.score ?? "-"}
                  </TableCell>

                  <TableCell className="text-center">
                    {student.theoryScores?.find((g: Grade) => g.type === "final")?.score ?? "-"}
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
                    {student.summary?.classification ?? "-"}
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

        {!isLoading && filteredGrades.length > 0 && (
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
