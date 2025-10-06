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
import { Calendar, Eye, Mail, MessageCircle, MessageSquare, MoreHorizontal } from "lucide-react";
import Pagination from "@/components/pagination";
import { Student } from "@packages/core/entities/Student";

export function StudentTable({
  students,
  pageSize = 10,
}: {
  students: Student[];
  pageSize?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = students?.length ?? 0;
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return students.slice(startIndex, startIndex + pageSize);
  }, [students, currentPage, pageSize]);

  if (!students || students.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6">
        Chưa có sinh viên.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table className="min-w-full border rounded-md">
        <TableHeader>
          <TableRow>
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
          {currentData.map((s) => {
            const parents =
              s.student_parent?.map((sp) => ({
                name: sp.parents?.users?.full_name,
                phone: sp.parents?.users?.phone,
                relation: sp.relationship,
              })) ?? [];

            return (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap">{s.student_code}</TableCell>
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
                                : "Phụ huynh"}{": "}
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
                      {/* Nhóm 1 */}
                      <DropdownMenuItem className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span>Chi tiết</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Điểm danh</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* Nhóm 2 */}
                      <DropdownMenuItem className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span>Nhắn tin</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>Gửi email</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <span>Gửi SMS</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Pagination
        totalItems={totalItems}
        pageSize={pageSize}
        currentPage={currentPage}
        onChange={setCurrentPage}
      />
    </div>
  );
}
