import { Card } from "@/components/ui/card";
import { Users, CalendarDays, GraduationCap } from "lucide-react";

interface PracticeGroupCardProps {
  groupNumber: number;
  lecturerName?: string;
  lecturerCode?: string;
  lecturerEmail?: string;
  studentCount: number;
  capacity?: number | null;
  schedule?: string | null;
}

export default function PracticeGroupCard({
  groupNumber,
  lecturerName,
  lecturerCode,
  lecturerEmail,
  studentCount,
  capacity,
  schedule,
}: PracticeGroupCardProps) {
  return (
    <Card
      className="h-full flex flex-col justify-between p-5 rounded-2xl border border-border/50
      bg-gradient-to-br from-card/95 to-card/70 shadow-md hover:shadow-xl
      hover:-translate-y-1 transition-all backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">
          Nhóm thực hành {groupNumber}
        </h3>
        <Users className="w-5 h-5 text-primary" />
      </div>

      {/* Lecturer */}
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>
          Giảng viên:{" "}
          <span className="font-medium text-foreground">
            {lecturerName || "Chưa phân công"}
          </span>{" "}
          {lecturerCode && (
            <span className="text-xs text-muted-foreground">({lecturerCode})</span>
          )}
        </p>
        {lecturerEmail && <p>Email: {lecturerEmail}</p>}
      </div>

      {/* Info */}
      <div className="flex justify-between items-center text-sm text-muted-foreground mt-3">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-primary" />
          {studentCount} SV
        </div>
        <div className="flex items-center gap-1">
          <GraduationCap className="w-4 h-4 text-primary" />
          {capacity ?? "-"} sức chứa
        </div>
      </div>

      {/* Schedule */}
      {schedule && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          {schedule}
        </div>
      )}
    </Card>
  );
}
