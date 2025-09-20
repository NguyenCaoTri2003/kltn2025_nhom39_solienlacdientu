import { GradeRepository } from "../../data/repositories/GradeRepository";

export async function getGrades(studentId: string) {
  const repo = new GradeRepository();
  return await repo.getGradesByStudent(studentId);
}
