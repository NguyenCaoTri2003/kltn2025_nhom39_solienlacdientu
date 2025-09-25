import { ClassesRepository } from "../../data/repositories/ClassesRepository";

export async function getClassesByMajor(majorId: number) {
  const repo = new ClassesRepository();
  return await repo.getClassesByMajor(majorId);
}


