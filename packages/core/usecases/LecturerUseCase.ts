import { LecturerRepository } from "../../data/repositories/LecturerRepository";

export class LecturerUseCase {
  private repository: LecturerRepository;

  constructor(repository: LecturerRepository) {
    this.repository = repository;
  }

  async getLecturersBySemester(semesterId: number) {
    return await this.repository.getLecturersBySemester(semesterId);
  }
}

// Export function for direct use
export async function getLecturersBySemester(semesterId: number) {
  const repo = new LecturerRepository();
  return await repo.getLecturersBySemester(semesterId);
}
