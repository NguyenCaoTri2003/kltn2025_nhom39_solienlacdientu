import { GradeRepository } from "@/data/repositories/GradeRepository";
import { GradeGroup } from "../entities/Grade";

export class GradeUseCase {
  private gradeRepo: GradeRepository;

  constructor(gradeRepo: GradeRepository) {
    this.gradeRepo = gradeRepo;
  }

  /**
   * Lấy tất cả điểm của sinh viên (gom theo học phần)
   */
  async getGradesByStudent(student_id: string): Promise<GradeGroup[]> {
    return await this.gradeRepo.getGradesByStudent(student_id);
  }

  /**
   * Lấy điểm chi tiết của sinh viên trong 1 học phần
   */
  async getGradesByOffering(student_id: string, offering_id: number) {
    return await this.gradeRepo.getGradesByOffering(student_id, offering_id);
  }
}
