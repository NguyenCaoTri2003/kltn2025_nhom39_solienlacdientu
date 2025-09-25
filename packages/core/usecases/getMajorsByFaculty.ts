import { MajorsRepository } from "../../data/repositories/MajorsRepository";

export async function getMajorsByFaculty(facultyId: number) {
  const repo = new MajorsRepository();
  return await repo.getMajorsByFaculty(facultyId);
}


