import { Card } from "@/components/ui/card";
import { Users, CalendarDays, GraduationCap } from "lucide-react";
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
  return (
    <Card
      className="h-full flex flex-col justify-between p-5 rounded-2xl border border-border/50
      bg-gradient-to-br from-card/95 to-card/70 shadow-md hover:shadow-xl
      hover:-translate-y-1 transition-all backdrop-blur-sm gap-1"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">
          Nhóm thực hành {groupNumber}
        </h3>
        <Users className="w-5 h-5 text-primary" />
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Giảng viên:</span>{" "}
          <span>
            {lecturerName || "Chưa phân công"}
          </span>{" "}
          {lecturerCode && (
            <span className="text-xs text-muted-foreground">({lecturerCode})</span>
          )}
        </p>
        {lecturerEmail && <p><span className="font-medium text-foreground">Email:</span>{" "} {lecturerEmail}</p>}
      </div>

      <WeeklyScheduleList
        schedules={schedule ?? undefined}
        filterType="practice"
        semester={semester ?? undefined}

      />

      <div className="flex justify-between items-center text-sm text-muted-foreground border-t border-border/50 mt-3 pt-3">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-primary" />
          {studentCount} SV
        </div>
      </div>

    </Card>
  );
}
