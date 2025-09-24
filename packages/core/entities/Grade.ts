export interface Grade {
  id: number;
  score_type: string;
  score: number | null;
  comment?: string;
}

export interface GradeGroup {
  offering_id: number;
  offering_name: string;
  class_code: string;
  course: {
    id: number;
    name: string;
    course_code: string;
    credit: number;
    semester_id: number;
  };
  lecturer_id: number | null;
  theoryScores: Grade[];
  practiceScores: Grade[];
}
