import { ClassesRepository } from "../../data/repositories/ClassesRepository";

export class ClassesUseCase {
  private repo: ClassesRepository;

  constructor() {
    this.repo = new ClassesRepository();
  }

  async getHomeroomClassesByLecturer(lecturerId: number, semesterId?: number) {
    return this.repo.getHomeroomClassesByLecturer(lecturerId, semesterId);
  }

  async getClassById(classId: number) {
    return this.repo.getClassById(classId);
  }

  async getClassesByMajor(majorId: number, user: any) {
    const allowedRoles = ["admin", "lecturer", "student"];
    if (!user || !allowedRoles.includes(user.role)) {
      throw new Error("You do not have access!");
    }

    return this.repo.getClassesByMajor(majorId);
  }

  async getAllClasses(user: any) {
    const allowedRoles = ["admin", "lecturer", "student"];
    if (!user || !allowedRoles.includes(user.role)) {
      throw new Error("You do not have access!");
    }

    return this.repo.getAllClasses();
  }
}
