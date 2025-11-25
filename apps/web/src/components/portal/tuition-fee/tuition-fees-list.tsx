"use client";

import { useState, useRef, useMemo } from "react";
import { useUser } from "@/context/user-context";
import { useTuitionFees } from "@/hooks/useTuitionFees";
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
import { CalendarDays, Paperclip, Wallet, PiggyBank, TrendingDown } from "lucide-react";
import { getFeeStatusLabel } from "@/utils/get-status-label";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatCurrency = (value?: number | string | null) =>
  currencyFormatter.format(Number(value ?? 0));

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

  const summaryStats = useMemo(() => {
    const totals = fees.reduce(
      (acc, fee) => {
        acc.payable += Number(fee.payable_amount ?? 0);
        acc.paid += Number(fee.paid_amount ?? 0);
        acc.debt += Number(fee.debt_amount ?? 0);
        return acc;
      },
      { payable: 0, paid: 0, debt: 0 }
    );
    return totals;
  }, [fees]);

  const handleSelectSemester = async (sem: any) => {
    if (sem) {
      setSemester(sem);
      await loadFeesBySemester(sem.id);
      topRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative py-8 sm:py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 -z-10 bg-[radial-gradient(120%_120%_at_50%_0%,rgba(59,130,246,0.15),rgba(59,130,246,0)_65%)] blur-[1px]" />
      <div className="mx-auto max-w-9xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 rounded-3xl border border-border/60 bg-card/60 p-4 sm:p-8 lg:p-10 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.6)] backdrop-blur-2xl">
          {/* Parent select child */}
          {isParent && children.length > 1 && (
            <div className="flex flex-wrap gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm shadow-inner shadow-black/5">
              {children.map((child: any, index: number) => {
                const isActive = selectedChildIndex === index;
                return (
                  <button
                    key={child.id}
                    className={`inline-flex items-center justify-center rounded-full border px-4 py-1.5 transition-all ${isActive
                      ? "border-primary/60 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground shadow-lg"
                      : "border-border/50 bg-card/80 text-foreground shadow hover:border-primary/40 hover:text-primary"
                      }`}
                    onClick={() => setSelectedChildIndex(index)}
                  >
                    {child.users?.full_name ?? `Con ${index + 1}`}
                  </button>
                );
              })}
            </div>
          )}

          {/* Semester selector */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            {semesters.length === 0 ? (
              <div className="h-11 w-60 rounded-full bg-muted animate-pulse" />
            ) : (
              <SemesterSelector
                onChange={handleSelectSemester}
                className="min-w-[240px] rounded-full border border-border/60 bg-background/70 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.55)] backdrop-blur"
              />
            )}
          </div>

          {/* Title */}
          {semester ? (
            <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/80 px-5 py-4 shadow-inner shadow-black/5 backdrop-blur">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {semester.name} ({semester.academic_year})
                </h2>
                <p className="text-sm text-muted-foreground">Danh sách học phí theo học kỳ</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/40 px-5 py-4">
              <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
              <div className="flex flex-col gap-2">
                <div className="h-5 w-40 rounded bg-muted animate-pulse" />
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
              </div>
            </div>
          )}

          {/* Summary cards */}
          {!loading && fees.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  label: "Tổng mức phải nộp",
                  value: formatCurrency(summaryStats.payable),
                  subtext: "Bao gồm tất cả khoản thu",
                  icon: Wallet,
                  accent: "text-primary bg-primary/10",
                },
                {
                  label: "Đã thanh toán",
                  value: formatCurrency(summaryStats.paid),
                  subtext: "Số tiền đã ghi nhận",
                  icon: PiggyBank,
                  accent: "text-emerald-600 bg-emerald-500/15",
                },
                {
                  label: "Công nợ còn lại",
                  value: formatCurrency(summaryStats.debt),
                  subtext: "Cần thanh toán thêm",
                  icon: TrendingDown,
                  accent: "text-amber-600 bg-amber-500/15",
                },
              ].map(({ label, value, subtext, icon: Icon, accent }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-inner shadow-black/5 backdrop-blur"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
                    </div>
                    <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{subtext}</p>
                </div>
              ))}
            </div>
          )}

          {/* Table / Empty / Error */}
          <div ref={topRef} className="space-y-10">
            {error && !loading && (
              <EmptyState
                icon={<Paperclip className="h-10 w-10 text-primary" />}
                text={error}
                className="rounded-2xl border border-destructive/30 bg-destructive/5 py-10"
              />
            )}

            {!error && fees.length === 0 && !loading && semester && (
              <EmptyState
                icon={<Paperclip className="h-10 w-10 text-muted-foreground" />}
                text="Không có dữ liệu học phí"
                className="rounded-2xl border border-border/60 bg-background/60 py-10"
              />
            )}

            {/* Fee tables */}
            {["tuition", "other"].map((type) => {
              const typeFees = fees.filter((f) =>
                type === "tuition" ? f.fee_type === "tuition" : f.fee_type !== "tuition"
              );
              if (typeFees.length === 0 && !loading) return null;

              return (
                <div key={type} className="space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-border/50 bg-muted/10 px-4 py-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      {type === "tuition" ? <Wallet className="h-5 w-5" /> : <PiggyBank className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {type === "tuition" ? "Danh sách khoản thu học phí" : "Danh sách khoản thu khác"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {type === "tuition"
                          ? "Chi tiết học phí theo từng lớp học phần và ưu đãi"
                          : "Các khoản phí bổ sung và thời hạn thanh toán"}
                      </p>
                    </div>
                  </div>

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
      </div>
    </div>
  );
}

/* UI Table component */
function FeeTable({ tuition, fees }: { tuition: boolean; fees: any[] }) {
  if (fees.length === 0) return null;

  return (
    <Card className="overflow-hidden rounded-none border border-border/60 bg-card/80 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.7)]">
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-muted/40">
              {tuition ? (
                <>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">STT</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Đợt</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Mã</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Mã LHP</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Nội dung</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Số TC</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Mức phí ban đầu</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">% Miễn giảm</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Số tiền miễn giảm</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Mức nộp</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Trạng thái ĐK</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Ngày nộp</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Số tiền nộp</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Khấu trừ (+)</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Trừ nợ (-)</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Công nợ</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Trạng thái</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">STT</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Năm học</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Mã khoản thu</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Tên khoản thu</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Mức nộp</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Ngày nộp</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Số tiền nộp</TableHead>
                  <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Công nợ</TableHead>
                   <TableHead className="uppercase tracking-wide text-xs font-semibold text-muted-foreground">Trạng thái</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {fees.map((f, i) => (
              <TableRow
                key={f.id}
                className="border-b border-border/40 bg-background/80 text-sm transition hover:bg-muted/30"
              >
                <TableCell className="font-semibold text-foreground">{i + 1}</TableCell>
                {tuition ? (
                  <>
                    <TableCell>
                      {f.semester_name && f.academic_year
                        ? `${f.semester_name} (${f.academic_year})`
                        : ""}
                    </TableCell>
                    <TableCell>{f.fee_code}</TableCell>
                    <TableCell>{f.class_code}</TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-foreground">{f.description}</TableCell>
                    <TableCell>{f.credit}</TableCell>
                    <TableCell>{formatCurrency(f.base_amount)}</TableCell>
                    <TableCell>{f.discount_percent}%</TableCell>
                    <TableCell>{formatCurrency(f.discount_amount)}</TableCell>
                    <TableCell className="text-primary font-semibold">{formatCurrency(f.payable_amount)}</TableCell>
                    <TableCell>{f.register_status}</TableCell>
                    <TableCell>{f.paid_date?.split("T")[0] ?? "-"}</TableCell>
                    <TableCell>{formatCurrency(f.paid_amount)}</TableCell>
                    <TableCell>{formatCurrency(f.plus_amount)}</TableCell>
                    <TableCell>{formatCurrency(f.minus_amount)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(f.debt_amount)}</TableCell>
                    <TableCell>
                      {(() => {
                        const { label, color } = getFeeStatusLabel(f.status);
                        return (
                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: `${color}20`, 
                              color: color,
                            }}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{f.academic_year}</TableCell>
                    <TableCell>{f.fee_code}</TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-foreground">{f.description}</TableCell>
                    <TableCell className="text-primary font-semibold">{formatCurrency(f.payable_amount)}</TableCell>
                    <TableCell>{f.paid_date?.split("T")[0] ?? "-"}</TableCell>
                    <TableCell>{formatCurrency(f.paid_amount)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(f.debt_amount)}</TableCell>
                    <TableCell>
                      {(() => {
                        const { label, color } = getFeeStatusLabel(f.status);
                        return (
                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: `${color}20`, 
                              color: color,
                            }}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

/* Skeleton Table Component */
function SkeletonTable({ rows, columns }: { rows: number; columns: number }) {
  return (
    <Card className="overflow-hidden rounded-none border border-border/60 bg-card/70 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.7)]">
      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <div className="h-4 w-20 animate-pulse rounded-full bg-muted" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, r) => (
              <TableRow key={r}>
                {Array.from({ length: columns }).map((_, c) => (
                  <TableCell key={c}>
                    <div className="h-4 w-full animate-pulse rounded-full bg-muted/70" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
