import { StudentsOverviewRepository } from "@packages/data/repositories/StudentsOverviewRepository";

export type OverviewRow = import("@packages/data/repositories/StudentsOverviewRepository").StudentsOverviewRow;
export type StudentsOverviewResult = import("@packages/data/repositories/StudentsOverviewRepository").StudentsOverviewResult;

// Thin use case: expose a function for API usage as requested
export async function getStudentsOverview(params?: { semesterId?: number; studentIds?: Array<number | string>; page?: number; pageSize?: number; search?: string; gpaMin?: number; gpaMax?: number }): Promise<StudentsOverviewResult> {
  const repo = new StudentsOverviewRepository();
  return repo.getOverview(params);
}
