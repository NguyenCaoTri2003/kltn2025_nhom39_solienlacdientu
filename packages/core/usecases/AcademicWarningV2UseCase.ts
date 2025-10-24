import { AcademicWarningV2Repository, type AcademicWarningV2Result } from "@packages/data/repositories/AcademicWarningV2Repository";

export class AcademicWarningV2UseCase {
  constructor(private repo: AcademicWarningV2Repository = new AcademicWarningV2Repository()) {}

  async list(params: {
    semesterId?: number | string;
    search?: string;
    classCode?: string;
    academicYear?: string;
    page?: number | string;
    pageSize?: number | string;
  }): Promise<AcademicWarningV2Result> {
    return this.repo.list({
      semesterId: this.toPositiveInt(params.semesterId),
      search: typeof params.search === "string" ? params.search.trim() : undefined,
      classCode: typeof params.classCode === "string" ? params.classCode.trim() : undefined,
      academicYear: typeof params.academicYear === "string" ? params.academicYear.trim() : undefined,
      page: this.toPositiveInt(params.page) ?? 1,
      pageSize: Math.min(this.toPositiveInt(params.pageSize) ?? 20, 100),
    });
  }

  private toPositiveInt(v: any): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  }
}

export const academicWarningV2UseCase = new AcademicWarningV2UseCase();
