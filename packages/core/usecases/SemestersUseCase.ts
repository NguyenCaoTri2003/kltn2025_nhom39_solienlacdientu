import { SemestersRepository } from "../../data/repositories/SemestersRepository";

export async function getSemesters() {
  const repo = new SemestersRepository();
  return await repo.getSemesters();
}


