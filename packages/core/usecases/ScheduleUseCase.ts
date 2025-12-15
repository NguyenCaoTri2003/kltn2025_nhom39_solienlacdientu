import { ScheduleRepository } from "@packages/data/repositories/ScheduleRepository";
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
    if (user.id !== lecturerId && user.role !== "admin") {
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
    if (user.id !== lecturerId && user.role !== "admin") {
      throw new Error("Forbidden");
    }
    return this.repo.getLecturerSchedulesOfferingByDate(
      lecturerId,
      offeringId,
      startDate,
      endDate
    );
  }

  async getStudentTodaySchedules(studentId: number) {
    return await this.repo.getStudentSchedulesToday(studentId);
  }

  async getLecturerTodaySchedules(lecturerId: number) {
    return await this.repo.getLecturerSchedulesToday(lecturerId);
  }

  async getOfferingScheduleToAttendance(offeringId: number, lecturerId: number, user: any) {

    if (!(await AuthorizationService.canViewOfferingGrades(user, offeringId))) {
      throw new Error("Giảng viên không có quyền xem lịch môn học này");
    }

    const schedules = await this.repo.getOfferingScheduleToAttendance(
      offeringId,
      lecturerId
    );

    const theoryDates = new Set<string>();
    const practiceDatesByGroup: Record<number, Set<string>> = {};

    for (const s of schedules) {
      const date = s.schedule_date.split("T")[0];

      if (s.type === "theory") {
        theoryDates.add(date);
      }

      if (s.type === "practice" && s.practice_group_id) {
        if (!practiceDatesByGroup[s.practice_group_id]) {
          practiceDatesByGroup[s.practice_group_id] = new Set();
        }
        practiceDatesByGroup[s.practice_group_id].add(date);
      }
    }

    return {
      theoryDates: Array.from(theoryDates),
      practiceDatesByGroup: Object.fromEntries(
        Object.entries(practiceDatesByGroup).map(([gid, dates]) => [
          gid,
          Array.from(dates),
        ])
      ),
    };
  }
}
