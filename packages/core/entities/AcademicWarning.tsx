import { Semester } from "./Semesters";
import { User } from "./Users";

// Underlying DB enum: warning_level_enum
export type WarningLevel = "low" | "medium" | "high" | string;

export interface AcademicWarning {
  id: number; // bigint identity
  student_id: number; // fk to users.id
  student?: User; // optional hydrated user entity
  semester_id: number; // fk to semesters.id
  semester?: Semester; // optional hydrated semester
  level: WarningLevel; // enum not null
  reason: string; // text not null
  warned_at?: string; // timestamptz default now()
}
