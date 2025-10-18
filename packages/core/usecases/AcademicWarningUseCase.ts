import { AcademicWarningRepository } from "@packages/data/repositories/AcademicWarningRepository";

export class AcademicWarningUseCase {
	constructor(private repo: AcademicWarningRepository = new AcademicWarningRepository()) {}

	async createWarning(input: { studentId: number; semesterId: number; level: string; reason: string }) {
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
}

