export type GradeClassification =
  | "Excellent"
  | "Very_Good"
  | "Good"
  | "Average"
  | "Weak"
  | "Poor";

export type SemesterSummary = {
  id: number;                          // bigint
  student_id: number;                  // bigint (FK → students.id)
  semester_id: number;                 // bigint (FK → semesters.id)

  avg_score_10?: number | null;        // numeric(5,2)
  avg_score_4?: number | null;         // numeric(3,2)
  cum_avg_score_10?: number | null;    // numeric(5,2)
  cum_avg_score_4?: number | null;     // numeric(3,2)

  total_credit_registered?: number | null;   // integer
  total_credit_accumulated?: number | null;  // integer
  total_credit_passed?: number | null;       // integer
  total_credit_failed?: number | null;       // integer

  semester_classification?: GradeClassification | null;   // enum
  cumulative_classification?: GradeClassification | null; // enum
};
