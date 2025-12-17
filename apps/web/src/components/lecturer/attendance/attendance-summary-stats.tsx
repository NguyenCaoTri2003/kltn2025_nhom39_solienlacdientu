import React from "react";
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  TrendingDown,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AttendanceSummaryStatsProps {
  students: { id: number; studentCode: string; fullName: string }[];
  attendanceMap: Record<number, Record<string, any[]>>;
  group: { key: string; groupId?: number; dates: string[] };
}

export const AttendanceSummaryStats: React.FC<AttendanceSummaryStatsProps> = ({
  students,
  attendanceMap,
  group,
}) => {
  const totalStudents = students.length;
  const totalSessions = group.dates.length;

  const countAbsentDays = (studentId: number) => {
    const recordsByDate = attendanceMap[studentId];
    if (!recordsByDate) return 0;

    let absentDays = 0;

    group.dates.forEach((date) => {
      const records = recordsByDate[date] || [];

      const isAbsent = records.some((r: any) => {
        if (group.key === "theory") {
          return r.type === "theory" && r.status === "absent";
        }

        return (
          r.type === "practice" &&
          r.practice_group_id === group.groupId &&
          r.status === "absent"
        );
      });

      if (isAbsent) absentDays++;
    });

    return absentDays;
  };

  const summary = students.map((s) => {
    const absent = countAbsentDays(s.id);
    const absentRate =
      totalSessions > 0 ? Math.round((absent / totalSessions) * 100) : 0;

    return {
      ...s,
      absent,
      absentRate,
    };
  });

  const absentOver3 = summary.filter((s) => s.absent >= 3).length;
  const absentOver20Percent = summary.filter(
    (s) => s.absentRate >= 20
  ).length;

  const maxAbsent = Math.max(...summary.map((s) => s.absent), 0);

  const highRiskStudents = summary
    .filter((s) => s.absent >= 3)
    .sort((a, b) => b.absent - a.absent)
    .slice(0, 5);

  return (
    <div className="mt-8 space-y-6 rounded-3xl border border-border/60 bg-gradient-to-br from-background/90 via-background/70 to-background/40 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 shadow-inner">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-xl font-semibold">Thống kê điểm danh</h4>
          <p className="text-sm text-muted-foreground">
            Tổng quan tình hình vắng học của sinh viên
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Users />}
          label="Tổng sinh viên"
          value={totalStudents}
        />
        <StatCard
          icon={<CalendarDays />}
          label="Tổng buổi học"
          value={totalSessions}
        />
        <StatCard
          icon={<Ban />}
          label="Cấm thi (≥3 buổi)"
          value={absentOver3}
          danger
        />
        <StatCard
          icon={<TrendingDown />}
          label="Nguy cơ (≥20%)"
          value={absentOver20Percent}
          warning
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Sinh viên thuộc diện cấm thi (nghỉ quá 3 buổi)</p>
        {highRiskStudents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Không có sinh viên nào vắng từ 3 buổi trở lên
          </p>
        ) : (
          <ul className="space-y-1 text-sm">
            {highRiskStudents.map((s) => (
              <li
                key={s.id}
                className="flex justify-between rounded-lg border border-border/40 bg-background/60 px-3 py-2"
              >
                <span>
                  {s.fullName} ({s.studentCode})
                </span>
                <Badge variant="destructive">
                  {s.absent}/{totalSessions} buổi ({s.absentRate}%)
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  label,
  value,
  danger,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  danger?: boolean;
  warning?: boolean;
}) => {
  const color = danger
    ? "text-red-600 bg-red-500/10"
    : warning
    ? "text-orange-600 bg-orange-500/10"
    : "text-primary bg-primary/10";

  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-inner">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
};
