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
  CalendarPlus,
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LabelRequired } from "@/components/ui/label-requied";
import AppointmentModal from "../appointment/appointment-modal";

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

  const [singleTargetId, setSingleTargetId] = useState<number | null>(null);

  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState<"student" | "parent" | null>(null);
  const [messageContent, setMessageContent] = useState("");

  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);

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

  const handleOpenMessageModal = (
    target: "student" | "parent",
    studentId?: number
  ) => {
    setMessageTarget(target);
    if (studentId) {
      setSingleTargetId(studentId);
      setSelectedIds([]);
    } else {
      setSingleTargetId(null);
    }
    setMessageModalOpen(true);
  };

  const handleSendMessages = async () => {
    try {
      setIsLoading(true);
      const receivers: number[] = [];

      if (singleTargetId) {
        const student = students.find((s) => s.id === singleTargetId);
        if (!student) throw new Error("Không tìm thấy sinh viên");

        if (messageTarget === "student") {
          receivers.push(student.id);
        } else if (messageTarget === "parent") {
          student.student_parent?.forEach((sp) => {
            if (sp.parents?.id) receivers.push(sp.parents.id);
          });
        }
      } else {
        selectedIds.forEach((sid) => {
          const student = students.find((s) => s.id === sid);
          if (!student) return;

          if (messageTarget === "student") {
            if (student?.id) receivers.push(student.id);
          } else if (messageTarget === "parent") {
            student.student_parent?.forEach((sp) => {
              if (sp.parents?.id) receivers.push(sp.parents.id);
            });
          }
        });
      }

      if (receivers.length === 0) {
        toast.error("Không tìm thấy người nhận hợp lệ.");
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Bạn chưa đăng nhập.");
        setIsLoading(false);
        return;
      }

      await Promise.all(
        receivers.map(async (receiverId) => {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: JSON.stringify({ receiverId, content: messageContent }),
          });
        })
      );

      setMessageModalOpen(false);
      toast.success("Gửi tin nhắn thành công!");
      setMessageContent("");
      router.push("/lecturer/communications");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi gửi tin nhắn");
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="relative w-[400px] md:max-w-sm">
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
            disabled={!hasSelection}
            className="gap-2"
            onClick={() => handleOpenMessageModal("student")}
          >
            <MessageSquare className="w-4 h-4" />
            Nhắn tin sinh viên
            {selectedIds.length > 0 && (
              <span className="ml-1">({selectedIds.length})</span>
            )}
          </Button>

          <Button
            variant="outline"
            disabled={!hasSelection}
            className="gap-2"
            onClick={() => handleOpenMessageModal("parent")}
          >
            <MessageCircle className="w-4 h-4" />
            Nhắn tin phụ huynh
            {selectedIds.length > 0 && (
              <span className="ml-1">({selectedIds.length})</span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!hasSelection}
            className="gap-2"
            onClick={() => setAppointmentModalOpen(true)}
          >
            <CalendarPlus className="w-4 h-4" />
            Đặt lịch hẹn
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
                          className="w-[200px] rounded-lg border border-border bg-background/95 backdrop-blur-sm shadow-lg p-1"
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenMessageModal("student", s.id)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Nhắn tin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenMessageModal("parent", s.id)}>
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Nhắn tin phụ huynh
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

        {messageModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">
                {messageTarget === "student" ? "Nhắn tin cho sinh viên" : "Nhắn tin cho phụ huynh"}
              </h2>

              <textarea
                className="w-full border rounded-md p-2 h-32 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nhập nội dung tin nhắn..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
              />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setMessageModalOpen(false)}>
                  Hủy
                </Button>
                <Button
                  disabled={!messageContent.trim()}
                  onClick={handleSendMessages}
                >
                  Gửi
                </Button>
              </div>
            </div>
          </div>
        )}

        <AppointmentModal 
          appointmentModalOpen={appointmentModalOpen} 
          setAppointmentModalOpen={setAppointmentModalOpen}
          selectedIds={selectedIds}
          students={students}
        />
      </div>
    </div>
  );
}
