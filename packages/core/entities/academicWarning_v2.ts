export type WarningLevel = 'FINAL' | 'SECOND' | 'FINAL';


export type AcademicWarning = {
  id: number;                         // bigint
  student_id: number;                 // FK → users.id (sinh viên)
  semester_id: number | null;         // FK → semesters.id (có thể null nếu bị xóa)
  level: WarningLevel;               // enum cảnh cáo
  reason: string;                     // lý do cảnh cáo
  warned_at: string;                  // timestamp with time zone (ISO string)
  cumulative_gpa?: number | null;     // GPA tích lũy tại thời điểm cảnh cáo
  debt_credits?: number | null;       // số tín chỉ nợ
  progress_status?: string | null;    // trạng thái tiến độ học tập
  created_by?: number | null;         // FK → users.id (người tạo cảnh cáo)
  note?: string | null;               // ghi chú thêm
};
