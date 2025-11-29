import { MajorsRepository } from "../../data/repositories/MajorsRepository";

export async function getMajorsByFaculty(facultyId: number) {
  const repo = new MajorsRepository();
  return await repo.getMajorsByFaculty(facultyId);
}

export async function getMajorById(majorId: number) {
  const repo = new MajorsRepository();
  return await repo.getMajorById(majorId);
}

export async function getAllMajors() {
  const repo = new MajorsRepository();
  return await repo.getAllMajors();
}


