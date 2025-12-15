import { AcademicWarningV3Repository, type AcademicWarningV3Result } from "@packages/data/repositories/AcademicWarningV3Repository";

export class AcademicWarningV3UseCase {
  constructor(private repo: AcademicWarningV3Repository = new AcademicWarningV3Repository()) {}

  async list(params: {
    semesterId?: number | string;
    search?: string;
    classCode?: string;
    academicYear?: string;
    onlyProposed?: boolean | string;
    isWarned?: boolean | string;
    page?: number | string;
    pageSize?: number | string;
  }): Promise<AcademicWarningV3Result> {
    return this.repo.list({
      semesterId: this.toPositiveInt(params.semesterId),
      search: typeof params.search === "string" ? params.search.trim() : undefined,
      classCode: typeof params.classCode === "string" ? params.classCode.trim() : undefined,
      academicYear: typeof params.academicYear === "string" ? params.academicYear.trim() : undefined,
      onlyProposed: params.onlyProposed === true || params.onlyProposed === "true" || params.onlyProposed === "1",
      isWarned: params.isWarned === true || params.isWarned === "true" ? true : params.isWarned === false || params.isWarned === "false" ? false : undefined,
      page: this.toPositiveInt(params.page) ?? 1,
      pageSize: Math.min(this.toPositiveInt(params.pageSize) ?? 20, 100),
    });
  }

  private toPositiveInt(v: any): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  }

  async createWarning(input: {
    studentId: number;
    semesterId: number;
    level: "FIRST" | "SECOND" | "FINAL" | string;
    reason: string;
    createdBy?: number;
    cumulativeGpa?: number | null;
    debtCredits?: number | null;
    progressStatus?: string | null;
    note?: string | null;
  }) {
    return this.repo.createWarning(input);
  }

  async getHistory(studentId: number) {
    return this.repo.getHistory(studentId);
  }

  async getStudentGrades(studentId: number, semesterId: number) {
    return this.repo.getStudentGrades(studentId, semesterId);
  }

  async getStudentWarnings(studentId: number, semesterId?: number) {
    return this.repo.getStudentWarnings(studentId, semesterId);
  }

  async markStudentAsWarned(studentId: number, semesterId: number, level: string) {
    return this.repo.markStudentAsWarned(studentId, semesterId, level);
  }

  async isStudentWarned(studentId: number, semesterId: number) {
    return this.repo.isStudentWarned(studentId, semesterId);
  }

  async getTotalCount(): Promise<number> {
    return this.repo.getTotalCount();
  }
}

export const academicWarningV3UseCase = new AcademicWarningV3UseCase();

