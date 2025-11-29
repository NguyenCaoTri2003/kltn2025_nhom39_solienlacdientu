import { AcademicWarningV3Repository, type AcademicWarningV3Result } from "@packages/data/repositories/AcademicWarningV3Repository";

export class AcademicWarningV3UseCase {
  constructor(private repo: AcademicWarningV3Repository = new AcademicWarningV3Repository()) {}

  async list(params: {
    semesterId?: number | string;
    search?: string;
    classCode?: string;
    academicYear?: string;
    onlyProposed?: boolean | string;
    page?: number | string;
    pageSize?: number | string;
  }): Promise<AcademicWarningV3Result> {
    return this.repo.list({
      semesterId: this.toPositiveInt(params.semesterId),
      search: typeof params.search === "string" ? params.search.trim() : undefined,
      classCode: typeof params.classCode === "string" ? params.classCode.trim() : undefined,
      academicYear: typeof params.academicYear === "string" ? params.academicYear.trim() : undefined,
      onlyProposed: params.onlyProposed === true || params.onlyProposed === "true" || params.onlyProposed === "1",
      page: this.toPositiveInt(params.page) ?? 1,
      pageSize: Math.min(this.toPositiveInt(params.pageSize) ?? 20, 100),
    });
  }

  private toPositiveInt(v: any): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  }
}

export const academicWarningV3UseCase = new AcademicWarningV3UseCase();

