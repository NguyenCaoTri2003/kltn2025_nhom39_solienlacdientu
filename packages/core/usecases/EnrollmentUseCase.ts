import { EnrollmentRepository } from "../../data/repositories/EnrollmentRepository";

export class EnrollmentUseCase {
  private repository: EnrollmentRepository;

  constructor(repository: EnrollmentRepository) {
    this.repository = repository;
  }

  async getStudentsByOffering(offeringId: number) {
    return await this.repository.getStudentsByOffering(offeringId);
  }

  async getStudentsByPracticeGroup(groupId: number) {
    return await this.repository.getStudentsByPracticeGroup(groupId);
  }
}

// Export function for direct use
export async function getStudentsByOffering(offeringId: number) {
  const repo = new EnrollmentRepository();
  return await repo.getStudentsByOffering(offeringId);
}

export async function getStudentsByPracticeGroup(groupId: number) {
  const repo = new EnrollmentRepository();
  return await repo.getStudentsByPracticeGroup(groupId);
}
