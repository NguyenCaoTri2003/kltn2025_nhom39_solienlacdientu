import { CoursesRepository } from "../../data/repositories/CoursesRepository";

export async function getCoursesByMajor(majorId: number) {
  const repo = new CoursesRepository();
  return await repo.getCoursesByMajorId(majorId);
}


