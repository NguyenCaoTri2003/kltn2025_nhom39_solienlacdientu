import { GradeRepository } from "@/data/repositories/GradeRepository";
import { GradeGroup } from "../entities/Grade";
import { AuthorizationService } from "../services/authorization/AuthorizationService";

export class GradeUseCase {
  private gradeRepo: GradeRepository;

  constructor(gradeRepo: GradeRepository) {
    this.gradeRepo = gradeRepo;
  }

  async getStudentGrades(studentId: string, user: any) {
    if (!(await AuthorizationService.canViewStudentGrades(user, studentId))) {
      throw new Error("Forbidden");
    }

    return this.gradeRepo.getGradesByStudent(studentId);
  }

  async getGradesByOffering(studentId: string, offeringId: number, user: any) {
    if (!(await AuthorizationService.canViewStudentGrades(user, studentId))) {
      throw new Error("Forbidden");
    }
    return this.gradeRepo.getGradesByOffering(studentId, offeringId);
  }

  async getOfferingGrades(offeringId: number, user: any) {
    if (!(await AuthorizationService.canViewOfferingGrades(user, offeringId))) {
      throw new Error("Forbidden");
    }

    return this.gradeRepo.getAllGradesByOffering(offeringId);
  }

  async getStudentGradesInOffering(studentId: string, offeringId: number, user: any) {
    if (!(await AuthorizationService.canViewOfferingGrades(user, offeringId))) {
      throw new Error("Forbidden");
    }

    return this.gradeRepo.getStudentGradesInOffering(studentId, offeringId);
  }
}
