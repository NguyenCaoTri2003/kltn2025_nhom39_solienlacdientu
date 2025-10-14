"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Eye,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  X,
  Search,
  Loader2,
  CalendarRange,
} from "lucide-react";
import Pagination from "@/components/pagination";
import { Student } from "@packages/core/entities/Student";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { normalize } from "@/utils/normalize";
import AttendanceModal from "../attendance/attendance-modal";
import { toast } from "sonner";
import { PracticeGroup } from "@packages/core/entities/PracticeGroup";

export function StudentTable({
  classId,
  type,
  enrollments,
  practiceGroups,
  students,
  pageSize = 10,
}: {
  classId: number;
  type: string;
  enrollments: { id: number; students: Student }[];
  practiceGroups: PracticeGroup[];
  students: Student[];
  pageSize?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const router = useRouter();

  const practiceGroupMap: Record<number, number> = {};
  practiceGroups.forEach(pg => {
    pg.students.forEach(pe => {
      practiceGroupMap[pe.enrollment.student_id] = pg.id;
    });
  });

  const getLastName = (fullName?: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1];
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const nameA = getLastName(a.users?.full_name);
      const nameB = getLastName(b.users?.full_name);
      return nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
    });
  }, [students]);

  const filteredStudents = useMemo(() => {
    let data = sortedStudents;

    if (query) {
      const normalizedQuery = normalize(query);

      data = data.filter((s) => {
        const parents =
          s.student_parent?.map((sp) => ({
            name: sp.parents?.users?.full_name,
            phone: sp.parents?.users?.phone,
          })) ?? [];

        const combined = [
          s.student_code,
          s.users?.full_name,
          s.users?.email,
          ...parents.map((p) => p.name),
          ...parents.map((p) => p.phone),
        ]
          .filter(Boolean)
          .map((v) => normalize(v as string))
          .join(" ");

        return combined.includes(normalizedQuery);
      });
    }

    return data.sort((a, b) => {
      const nameA = getLastName(a.users?.full_name);
      const nameB = getLastName(b.users?.full_name);
      return nameA.localeCompare(nameB, "vi", { sensitivity: "base" });
    });
  }, [sortedStudents, query]);

  const totalItems = filteredStudents.length;
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => {
      setQuery(searchTerm);
      setIsLoading(false);
      setCurrentPage(1);
    }, 600);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setQuery("");
  };

  const toggleSelectAll = () => {
    const ids = currentData.map((s) => s.id);
    if (ids.every((id) => selectedIds.includes(id))) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allChecked =
    currentData.length > 0 &&
    currentData.every((s) => selectedIds.includes(s.id));

  const hasSelection = selectedIds.length > 0;

  if (!students || students.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        Chưa có sinh viên.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative w-[420px]">
            <Input
              placeholder="Tìm theo MSSV, họ tên, email, phụ huynh..."
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

          <Button variant="default" onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" /> Tìm kiếm
          </Button>

          {query && (
            <Button variant="destructive" onClick={clearSearch}>
              Xóa tìm kiếm
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/lecturer/classes/${classId}/attendance`)}
          >
            <CalendarRange className="w-4 h-4" />
            Chi tiết điểm danh{" "}
          </Button>
          <Button
            variant="outline"
            disabled={!hasSelection}
            className="gap-2"
          >
            <Mail className="w-4 h-4" />
            Gửi email
            {" "}
            {selectedIds.length > 0 && (
              <span className="ml-1">({selectedIds.length})</span>
            )}
          </Button>
        </div>
      </div>

      <div className="relative min-h-[200px]">
        <Table className="min-w-full border rounded-md">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] text-center">
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>STT</TableHead>
              <TableHead className="w-[100px]">Mã SV</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phụ huynh</TableHead>
              <TableHead className="w-[120px] text-center whitespace-nowrap">
                Chức năng
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Đang tìm kiếm...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-6 text-muted-foreground"
                >
                  Không tìm thấy sinh viên phù hợp.
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((s, idx) => {
                const parents =
                  s.student_parent?.map((sp) => ({
                    name: sp.parents?.users?.full_name,
                    phone: sp.parents?.users?.phone,
                    relation: sp.relationship,
                  })) ?? [];

                return (
                  <TableRow key={s.id} className="hover:bg-accent/50">
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedIds.includes(s.id)}
                        onCheckedChange={() => toggleSelect(s.id)}
                      />
                    </TableCell>
                    <TableCell>{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {s.student_code}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {s.users?.full_name}
                    </TableCell>
                    <TableCell>{s.users?.email || "-"}</TableCell>
                    <TableCell>
                      {parents.length > 0 ? (
                        <div className="space-y-1">
                          {parents.map((p, i) => (
                            <div key={i} className="text-sm leading-tight">
                              <span className="font-medium text-foreground">
                                {p.relation === "father"
                                  ? "Cha"
                                  : p.relation === "mother"
                                    ? "Mẹ"
                                    : "Phụ huynh"}
                                {": "}
                              </span>
                              <span>{p.name}</span>
                              {p.phone && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  ({p.phone})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Không có
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-accent"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          className="w-[180px] rounded-lg border border-border bg-background/95 backdrop-blur-sm shadow-lg p-1"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/lecturer/classes/${classId}/student/${s.id}`
                              )
                            }
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="w-4 h-4 mr-2" />
                            Điểm danh
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Nhắn tin
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Gửi email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Gửi SMS
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {!isLoading && filteredStudents.length > 0 && (
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
