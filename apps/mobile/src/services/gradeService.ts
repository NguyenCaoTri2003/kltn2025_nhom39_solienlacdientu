import { API_URL } from "../constants/config";
import { getAuthToken } from "../utils/auth";

export type Score = {
  id: number;
  score_type: string;
  score: number;
  comment: string;
};

export type PracticeScore = Score & {
  practice_group?: { id: number; group_number: number };
};

export type CourseGrade = {
  offering_id: number;
  offering_name: string;
  class_code: string;
  lecturer_id: number;
  theoryScores: Score[];
  practiceScores: PracticeScore[];
  summary: {
    total_score: number;
    gpa4: number;
    letter_grade: string;
    classification: string;
    passed: boolean;
    note?: string | null;
  };
};

export async function fetchGrades(student_id: number, semester_id: number): Promise<CourseGrade[]> {
  const token = await getAuthToken();

  const res = await fetch(`${API_URL}/api/grades?student_id=${student_id}&semester_id=${semester_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = await res.json();
  // Nếu API trả mảng trực tiếp
  if (!Array.isArray(json)) throw new Error("Invalid API response");

  return json;
}
