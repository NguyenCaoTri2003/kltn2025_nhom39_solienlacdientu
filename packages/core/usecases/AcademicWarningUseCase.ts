import { AcademicWarningRepository } from "@packages/data/repositories/AcademicWarningRepository";

export class AcademicWarningUseCase {
	constructor(private repo: AcademicWarningRepository = new AcademicWarningRepository()) {}

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
		return this.repo.getWarningsForStudent(studentId, semesterId);
	}

	async markStudentAsWarned(studentId: number, semesterId: number, level: string) {
		return this.repo.markStudentAsWarned(studentId, semesterId, level);
	}

	async isStudentWarned(studentId: number, semesterId: number) {
		return this.repo.isStudentWarned(studentId, semesterId);
	}
}

