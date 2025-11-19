"use client";

import { useState, useRef } from "react";
import { useUser } from "@/context/user-context";
import { useTuitionFees } from "@/hooks/useTuitionFees";
import Loading from "@/components/ui/loading"; 
import EmptyState from "@/components/empty-state";
import SemesterSelector from "@/components/lecturer/classes/semester-selector";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, Paperclip } from "lucide-react";

export default function TuitionFeesList() {
  const { userData } = useUser();
  const isParent = userData?.role === "parent";
  const children = userData?.children || [];
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const activeChild = isParent ? children[selectedChildIndex] : null;

  const studentId = isParent ? activeChild?.id : userData?.student?.id;
  const studentYear = isParent ? activeChild?.academic_year : userData?.student?.academic_year;

  const { semester, setSemester, semesters, fees, loading, error, loadFeesBySemester } =
    useTuitionFees(studentYear, studentId);

  const topRef = useRef<HTMLDivElement | null>(null);

  const handleSelectSemester = async (sem: any) => {
    if (sem) {
      setSemester(sem);
      await loadFeesBySemester(sem.id);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative space-y-6">
      {/* Parent select child */}
      {isParent && children.length > 1 && (
        <div className="flex gap-2 flex-wrap rounded-xl border p-3 bg-muted/30">
          {children.map((child: any, index: number) => (
            <button
              key={child.id}
              className={`px-4 py-2 rounded-full text-sm transition ${
                selectedChildIndex === index
                  ? "bg-primary text-white"
                  : "bg-background text-foreground"
              }`}
              onClick={() => setSelectedChildIndex(index)}
            >
              {child.users?.full_name ?? `Con ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Semester selector */}
      <div className="flex justify-between items-center">
        {semesters.length === 0 ? (
          <div className="w-60 h-10 rounded-xl bg-gray-200 animate-pulse" />
        ) : (
          <SemesterSelector onChange={handleSelectSemester} className="min-w-[240px]" />
        )}
      </div>

      {/* Title */}
      {semester ? (
        <div className="flex items-center gap-3 rounded-xl border bg-background/70 p-4 shadow">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {semester.name} ({semester.academic_year})
            </h2>
            <p className="text-sm text-muted-foreground">Danh sách học phí</p>
          </div>
        </div>
      ) : (
        // Skeleton cho title
        <div className="flex items-center gap-3 rounded-xl border bg-gray-100 p-4">
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      )}

      {/* Table / Empty / Error */}
      <div className="relative space-y-8">
        {error && !loading && (
          <EmptyState icon={<Paperclip className="w-10 h-10" />} text={error} />
        )}

        {!error && fees.length === 0 && !loading && semester && (
          <EmptyState icon={<Paperclip className="w-10 h-10" />} text="Không có dữ liệu học phí" />
        )}

        {/* Fee tables */}
        {["tuition", "other"].map((type) => {
          const typeFees = fees.filter((f) => (type === "tuition" ? f.fee_type === "tuition" : f.fee_type !== "tuition"));
          if (typeFees.length === 0 && !loading) return null;

          return (
            <div key={type} ref={topRef} className="space-y-2">
              {/* Table header title */}
              <h3 className="text-lg font-semibold">
                {type === "tuition" ? "Danh sách khoản thu học phí" : "Danh sách khoản thu khác"}
              </h3>

              {/* Skeleton table */}
              {loading ? (
                <SkeletonTable rows={5} columns={type === "tuition" ? 18 : 9} />
              ) : (
                <FeeTable tuition={type === "tuition"} fees={typeFees} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* UI Table component */
function FeeTable({ tuition, fees }: { tuition: boolean; fees: any[] }) {
  if (fees.length === 0) return null;

  return (
    <Card className="overflow-auto rounded-2xl border shadow">
      <Table>
        <TableHeader>
          <TableRow>
            {tuition ? (
              <>
                <TableHead>STT</TableHead>
                <TableHead>Đợt</TableHead>
                <TableHead>Mã</TableHead>
                <TableHead>Mã LHP</TableHead>
                <TableHead>Nội dung</TableHead>
                <TableHead>Số TC</TableHead>
                <TableHead>Mức phí ban đầu</TableHead>
                <TableHead>% Miễn giảm</TableHead>
                <TableHead>Số tiền miễn giảm</TableHead>
                <TableHead>Mức nộp</TableHead>
                <TableHead>Trạng thái ĐK</TableHead>
                <TableHead>Ngày nộp</TableHead>
                <TableHead>Số tiền nộp</TableHead>
                <TableHead>Khấu trừ (+)</TableHead>
                <TableHead>Trừ nợ (-)</TableHead>
                <TableHead>Công nợ</TableHead>
                <TableHead>Trạng thái</TableHead>
              </>
            ) : (
              <>
                <TableHead>STT</TableHead>
                <TableHead>Năm học</TableHead>
                <TableHead>Tên đợt</TableHead>
                <TableHead>Mã khoản thu</TableHead>
                <TableHead>Tên khoản thu</TableHead>
                <TableHead>Mức nộp</TableHead>
                <TableHead>Ngày nộp</TableHead>
                <TableHead>Số tiền nộp</TableHead>
                <TableHead>Công nợ</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {fees.map((f, i) => (
            <TableRow key={f.id}>
              <TableCell>{i + 1}</TableCell>
              {tuition ? (
                <>
                  <TableCell>{f.term_name ?? "-"}</TableCell>
                  <TableCell>{f.fee_code}</TableCell>
                  <TableCell>{f.class_code}</TableCell>
                  <TableCell>{f.description}</TableCell>
                  <TableCell>{f.credit}</TableCell>
                  <TableCell>{f.base_amount}</TableCell>
                  <TableCell>{f.discount_percent}%</TableCell>
                  <TableCell>{f.discount_amount}</TableCell>
                  <TableCell>{f.payable_amount}</TableCell>
                  <TableCell>{f.register_status}</TableCell>
                  <TableCell>{f.paid_date?.split("T")[0] ?? "-"}</TableCell>
                  <TableCell>{f.paid_amount}</TableCell>
                  <TableCell>{f.plus_amount}</TableCell>
                  <TableCell>{f.minus_amount}</TableCell>
                  <TableCell>{f.debt_amount}</TableCell>
                  <TableCell>{f.status}</TableCell>
                </>
              ) : (
                <>
                  <TableCell>{f.academic_year}</TableCell>
                  <TableCell>{f.term_name}</TableCell>
                  <TableCell>{f.fee_code}</TableCell>
                  <TableCell>{f.description}</TableCell>
                  <TableCell>{f.payable_amount}</TableCell>
                  <TableCell>{f.paid_date?.split("T")[0] ?? "-"}</TableCell>
                  <TableCell>{f.paid_amount}</TableCell>
                  <TableCell>{f.debt_amount}</TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

/* Skeleton Table Component */
function SkeletonTable({ rows, columns }: { rows: number; columns: number }) {
  return (
    <Card className="overflow-auto rounded-2xl border shadow">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, r) => (
            <TableRow key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <TableCell key={c}>
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
