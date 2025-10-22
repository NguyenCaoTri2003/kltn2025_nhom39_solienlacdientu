import { SemestersRepository } from "../../data/repositories/SemestersRepository";

export async function getSemesters(fromYear?: number) {
  const repo = new SemestersRepository();

  if (fromYear) {
    return await repo.getSemestersFromYear(fromYear);
  }

  return await repo.getSemesters();
}