import { ScheduleRepository } from "@/data/repositories/ScheduleRepository";
import { AuthorizationService } from "../services/authorization/AuthorizationService";

export class ScheduleUseCase {
  private repo: ScheduleRepository;

  constructor(repo: ScheduleRepository) {
    this.repo = repo;
  }

  async getStudentSchedulesByDate(
    studentId: number,
    startDate: string, 
    endDate: string, 
    user: any
  ) {
    if (!(await AuthorizationService.canViewStudent(user, studentId))) {
      throw new Error("Forbidden");
    }
    return this.repo.getStudentSchedulesByDate(studentId, startDate, endDate);
  }

  async getStudentOfferingScheduleByDate(
    studentId: number, 
    offeringId: number, 
    user: any, 
    startDate: string, 
    endDate: string
  ) {
    if (!(await AuthorizationService.canViewStudent(user, studentId))) {
      throw new Error("Forbidden");
    }
    return this.repo.getStudentSchedulesOfferingByDate(studentId, offeringId, startDate, endDate);
  }

  async getLecturerSchedulesByDate(
    lecturerId: number,
    startDate: string,
    endDate: string,
    user: any
  ) {
    if (user.role !== "lecturer" && user.role !== "admin") {
      throw new Error("Forbidden");
    }
    return this.repo.getLecturerSchedulesByDate(lecturerId, startDate, endDate);
  }

  async getLecturerSchedulesOfferingByDate(
    lecturerId: number,
    offeringId: number,
    startDate: string,
    endDate: string,
    user: any
  ) {
    if (user.role !== "lecturer" && user.role !== "admin") {
      throw new Error("Forbidden");
    }
    return this.repo.getLecturerSchedulesOfferingByDate(
      lecturerId,
      offeringId,
      startDate,
      endDate
    );
  }

}
