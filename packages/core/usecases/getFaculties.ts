import { FacultiesRepository } from "../../data/repositories/FacultiesRepository";

export async function getFaculties(faculty_id: number) {
  const repo = new FacultiesRepository();
  return await repo.getFaculties(faculty_id);
}
