import { CourseOfferingRepository } from "@packages/data/repositories/CourseOfferingRepository";
import { EnrollmentRepository } from "@packages/data/repositories/EnrollmentRepository";
import { AuthorizationService } from "../services/authorization/AuthorizationService"; 

export class CourseOfferingUseCase {
  private courseRepo: CourseOfferingRepository;
  private enrollmentRepo: EnrollmentRepository;

  constructor(courseRepo: CourseOfferingRepository, enrollmentRepo: EnrollmentRepository) {
    this.courseRepo = courseRepo;
    this.enrollmentRepo = enrollmentRepo;
  }

  async canViewOffering(user: any, offeringId: number): Promise<boolean> {
    return AuthorizationService.canViewOffering(user, offeringId);
  }

  async getOfferingDetail(offeringId: number, user?: any) {
    if (user) {
      const allowed = await this.canViewOffering(user, offeringId);
      if (!allowed) throw new Error("Forbidden");
    }

    const offering = await this.courseRepo.getOfferingById(offeringId);
    if (!offering) return null;

    const students = await this.enrollmentRepo.getStudentsByOffering(offeringId);

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

export async function getOfferingDetail(offeringId: number, user?: any) {
  const courseRepo = new CourseOfferingRepository();
  const enrollmentRepo = new EnrollmentRepository();
  const usecase = new CourseOfferingUseCase(courseRepo, enrollmentRepo);
  return await usecase.getOfferingDetail(offeringId, user);
}
