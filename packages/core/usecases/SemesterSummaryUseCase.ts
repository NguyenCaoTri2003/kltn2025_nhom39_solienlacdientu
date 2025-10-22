import { SemesterSummaryRepository } from "@packages/data/repositories/SemesterSummaryRepository";

export class SemesterSummaryUseCase {
  private repo: SemesterSummaryRepository;

  constructor(repo: SemesterSummaryRepository) {
    this.repo = repo;
  }

  async getStudentSummary(student_id: number, semester_id?: number) {
    if (semester_id) {
      return await this.repo.getByStudentAndSemester(student_id, semester_id);
    }
    return await this.repo.getAllByStudent(student_id);
  }
}
