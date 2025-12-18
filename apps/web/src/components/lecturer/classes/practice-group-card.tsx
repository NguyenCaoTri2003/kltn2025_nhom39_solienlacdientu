import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import WeeklyScheduleList from "./weekly-schedule-list";
import { WeeklySchedule } from "@packages/core/entities/WeeklySchedule";
import { Semester } from "@packages/core/entities/Semesters";

interface PracticeGroupCardProps {
  groupNumber: number;
  lecturerName?: string;
  lecturerCode?: string;
  lecturerEmail?: string;
  studentCount: number;
  capacity?: number | null;
  schedule?: WeeklySchedule[] | null | undefined;
  semester?: Semester | null;
}

export default function PracticeGroupCard({
  groupNumber,
  lecturerName,
  lecturerCode,
  lecturerEmail,
  studentCount,
  capacity,
  schedule,
  semester,
}: PracticeGroupCardProps) {
  const normalizedCapacity =
    capacity === null || capacity === undefined ? null : Number(capacity);

  return (
    <Card
      className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/90 to-background/60 p-5 shadow-[0_24px_80px_-50px_rgba(59,130,246,0.55)] transition-all duration-300 hover:border-primary/40 hover:shadow-[0_32px_100px_-55px_rgba(59,130,246,0.65)]"
    >
      <div className="pointer-events-none absolute -top-12 -right-6 h-32 w-32 rounded-full bg-primary/20 opacity-60 blur-3xl transition-all duration-500 group-hover:scale-125" />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner shadow-primary/10">
              <span className="text-base font-semibold">#{groupNumber}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Nhóm thực hành {groupNumber}
              </h3>
            </div>
          </div>
          <Users className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            <span className="font-medium text-foreground">Giảng viên:</span>
            <span className="single-ellipsis">
              {lecturerName || "Chưa phân công"}
            </span>
            {lecturerCode && (
              <span className="text-xs text-muted-foreground">({lecturerCode})</span>
            )}
          </p>
          {lecturerEmail && (
            <p className="flex items-center gap-1">
              <span className="font-medium text-foreground">Email:</span>
              <span className="single-ellipsis">{lecturerEmail}</span>
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-dashed border-border/50 bg-background/60 p-4">
          <WeeklyScheduleList
            schedules={schedule ?? undefined}
            filterType="practice"
            semester={semester ?? undefined}
          />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </span>
            <span className="font-semibold text-foreground">{studentCount} SV</span>
          </div>
          {normalizedCapacity !== null && (
            <span className="text-xs font-medium text-muted-foreground">
              Tối đa {normalizedCapacity} SV
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
