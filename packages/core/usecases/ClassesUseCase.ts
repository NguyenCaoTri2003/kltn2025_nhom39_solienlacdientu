import { ClassesRepository } from "../../data/repositories/ClassesRepository";

export class ClassesUseCase {
  private repo: ClassesRepository;

  constructor() {
    this.repo = new ClassesRepository();
  }

  async getHomeroomClassesByLecturer(lecturerId: number, semesterId?: number) {
    return this.repo.getHomeroomClassesByLecturer(lecturerId, semesterId);
  }

  async getHomeroomClassDetail(classId: number, user: any) {
    if (!user || user.role !== "lecturer") {
      throw new Error("Forbidden");
    }

    const classData = await this.repo.getClassById(classId);

    if (!classData) {
      throw new Error("Class not found");
    }

    if (classData.homeroom_teacher_id !== user.id) {
      throw new Error("Forbidden: Không phải lớp chủ nhiệm của bạn");
    }

    return classData;
  }

  async getClassesByMajor(majorId: number, user: any) {
    const allowedRoles = ["admin", "lecturer", "student"];
    if (!user || !allowedRoles.includes(user.role)) {
      throw new Error("Forbidden: Bạn không có quyền truy cập!");
    }

    return this.repo.getClassesByMajor(majorId);
  }

  async getAllClasses(user: any) {
    const allowedRoles = ["admin", "lecturer", "student"];
    if (!user || !allowedRoles.includes(user.role)) {
      throw new Error("Forbidden: Bạn không có quyền truy cập!");
    }

    return this.repo.getAllClasses();
  }
}
