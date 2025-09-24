import { GradeRepository } from "@/data/repositories/GradeRepository";

export class GradeUseCase {
  private repo: GradeRepository;

  constructor(repo: GradeRepository) {
    this.repo = repo;
  }

  async getStudentGrades(student_id: number) {
    return await this.repo.getGradesByStudent(student_id);
  }

  async getOfferingGrades(student_id: number, offering_id: number) {
    return await this.repo.getGradesByOffering(student_id, offering_id);
  }
}