import { FacultiesRepository } from "../../data/repositories/FacultiesRepository";

export async function getFacultyById(facultyId: number) {
  const repo = new FacultiesRepository();
  return await repo.getFacultyById(facultyId);
}

export async function getAllFaculties() {
  const repo = new FacultiesRepository();
  return await repo.getAllFaculties();
}


