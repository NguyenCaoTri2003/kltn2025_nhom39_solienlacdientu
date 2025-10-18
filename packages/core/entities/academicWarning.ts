// Enums — khớp với PostgreSQL enum
export type WarningLevel = 'minor' | 'moderate' | 'severe';

export type AcademicStatus =
  | 'studing'
  | 'graduated'
  | 'warned'
  | 'suspended';

export type TrainingType = 'regular' | 'advanced';
export type TrainingLevel = 'bachelor' | 'master' | 'phd';
export type GradeClassification =
  | 'Excellent'
  | 'Very_Good'
  | 'Good'
  | 'Average'
  | 'Weak'
  | 'Poor';


export interface AcademicWarningOverview {
  // Thông tin sinh viên
  student_id: string; // UUID
  student_code: string;
  full_name: string;
  class_code?: string;
  class_name?: string;
  type_of_tranning?: string; // Chính quy / CLC
  training_level?: TrainingLevel;   // Cử nhân / Thạc sĩ / Tiến sĩ
  academic_status?: AcademicStatus;  // studing, warned, suspended...
  academic_year?: string;

  // Học kỳ
  semester_id: string;
  semester_name: string;
  semester_year: string;

  // Kết quả học tập
  gpa: number;
  failed_subjects: number;

  // Cảnh cáo
  warning_level?: WarningLevel;
  warning_reason?: string;
  warned_at?: string;
  predicted_warning_level?: WarningLevel;
}