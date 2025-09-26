import { CourseOfferingRepository } from "../../data/repositories/CourseOfferingRepository";

export async function getOfferingsByCourse(courseId: number) {
  const repo = new CourseOfferingRepository();
  return await repo.getOfferingsByCourse(courseId);
}


