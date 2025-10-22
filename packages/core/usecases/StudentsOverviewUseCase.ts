import { StudentsOverviewRepository } from "@packages/data/repositories/StudentsOverviewRepository";

export type StudentsOverviewRow = import("@packages/data/repositories/StudentsOverviewRepository").StudentsOverviewRow;
export type StudentsOverviewResult = import("@packages/data/repositories/StudentsOverviewRepository").StudentsOverviewResult;

export interface GetStudentsOverviewParams {
  semesterId?: number;
  studentIds?: Array<number | string>;
  page?: number;
  pageSize?: number;
  search?: string;
  gpaMin?: number;
  gpaMax?: number;
  facultyName?: string;
  classCode?: string;
  academicStatus?: string;
  failedMax?: number;
  attendanceMin?: number;
  warningFilter?: string;
}

export class StudentsOverviewUseCase {
  private repository: StudentsOverviewRepository;

  constructor(repository?: StudentsOverviewRepository) {
    this.repository = repository ?? new StudentsOverviewRepository();
  }

  async execute(params: GetStudentsOverviewParams = {}): Promise<StudentsOverviewResult> {
    const normalized = this.normalizeParams(params);
    return this.repository.getOverview(normalized);
  }

  private normalizeParams(params: GetStudentsOverviewParams) {
    const studentIds = params.studentIds?.map((v) => Number(v)).filter((v) => Number.isFinite(v) && v > 0);
    return {
      semesterId: this.toPositiveInt(params.semesterId),
      studentIds: studentIds && studentIds.length ? (studentIds as number[]) : undefined,
      page: this.toPositiveInt(params.page) ?? 1,
      pageSize: Math.min(this.toPositiveInt(params.pageSize) ?? 20, 100),
      search: typeof params.search === "string" ? params.search.trim() : "",
      gpaMin: this.toFloat(params.gpaMin),
      gpaMax: this.toFloat(params.gpaMax),
      facultyName: typeof params.facultyName === "string" && params.facultyName.trim() ? params.facultyName.trim() : undefined,
      classCode: typeof params.classCode === "string" && params.classCode.trim() ? params.classCode.trim() : undefined,
      academicStatus: typeof params.academicStatus === "string" && params.academicStatus.trim() && params.academicStatus !== "all" ? params.academicStatus.trim() : undefined,
      failedMax: this.toPositiveInt(params.failedMax),
      attendanceMin: this.toFloat(params.attendanceMin),
      warningFilter: typeof params.warningFilter === "string" && params.warningFilter.trim() && params.warningFilter !== "all" ? params.warningFilter.trim() : undefined,
    } as {
      semesterId?: number;
      studentIds?: number[];
      page?: number;
      pageSize?: number;
      search?: string;
      gpaMin?: number;
      gpaMax?: number;
      facultyName?: string;
      classCode?: string;
      academicStatus?: string;
      failedMax?: number;
      attendanceMin?: number;
      warningFilter?: string;
    };
  }

  private toPositiveInt(v: any): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  }

  private toFloat(v: any): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
}

export const studentsOverviewUseCase = new StudentsOverviewUseCase();

export async function getStudentsOverview(params: GetStudentsOverviewParams = {}): Promise<StudentsOverviewResult> {
  return studentsOverviewUseCase.execute(params);
}
