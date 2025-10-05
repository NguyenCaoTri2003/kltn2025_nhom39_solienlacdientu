import { CourseOfferingRepository } from "@packages/data/repositories/CourseOfferingRepository";
import { EnrollmentRepository } from "@packages/data/repositories/EnrollmentRepository";

export class CourseOfferingUseCase {
  private courseRepo: CourseOfferingRepository;
  private enrollmentRepo: EnrollmentRepository;

  constructor(courseRepo: CourseOfferingRepository, enrollmentRepo: EnrollmentRepository) {
    this.courseRepo = courseRepo;
    this.enrollmentRepo = enrollmentRepo;
  }

  async getOfferingDetail(offeringId: number) {
    const offering = await this.courseRepo.getOfferingById(offeringId);
    if (!offering) return null;

    // Sinh viên lý thuyết
    const students = await this.enrollmentRepo.getStudentsByOffering(offeringId);

    // Nhóm thực hành
    const practiceGroups = await this.courseRepo.getPracticeGroups(offeringId);

    const practiceGroupsWithStudents = await Promise.all(
      practiceGroups.map(async (g) => {
        const members = await this.enrollmentRepo.getStudentsByPracticeGroup(g.id);
        return { ...g, students: members };
      })
    );

    return {
      ...offering,
      students,
      practice_groups: practiceGroupsWithStudents,
      practice_group_count: practiceGroups.length,
    };
  }
}

// --- Export function for direct use ---
export async function getOfferingDetail(offeringId: number) {
  const courseRepo = new CourseOfferingRepository();
  const enrollmentRepo = new EnrollmentRepository();
  const usecase = new CourseOfferingUseCase(courseRepo, enrollmentRepo);
  return await usecase.getOfferingDetail(offeringId);
}
