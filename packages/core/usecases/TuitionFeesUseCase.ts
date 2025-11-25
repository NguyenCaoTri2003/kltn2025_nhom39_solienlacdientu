import { TuitionFeesRepository } from "@packages/data/repositories/TuitionFeesRepository";

export class TuitionFeesUseCase {
  private repo: TuitionFeesRepository;

  constructor() {
    this.repo = new TuitionFeesRepository();
  }

  async execute(studentId: number, semesterId: number | null) {
    if (!studentId) {
      throw new Error("Thiếu studentId");
    }

    const fees = await this.repo.getFees(studentId, semesterId);

    return fees.map((item) => {
      const enrollment = Array.isArray(item.enrollment)
        ? item.enrollment[0]
        : item.enrollment;

      const offering = Array.isArray(enrollment?.offering)
        ? enrollment.offering[0]
        : enrollment?.offering;

      const semester = Array.isArray(item.semester) ? item.semester[0] : item.semester;

      return {
        id: item.id,
        fee_type: item.fee_type,
        fee_code: item.fee_code,
        description: item.description,
        credit: item.credit,
        base_amount: item.base_amount,
        discount_percent: item.discount_percent,
        discount_amount: item.discount_amount,
        payable_amount: item.payable_amount,
        paid_amount: item.paid_amount,
        plus_amount: item.plus_amount,
        minus_amount: item.minus_amount,
        debt_amount: item.debt_amount,
        status: item.status,
        paid_date: item.paid_date,

        course_name: offering?.name ?? null,
        class_code: offering?.class_code ?? null,
        semester_id: item.semester_id,
        semester_name: semester?.name ?? null,
        academic_year: semester?.academic_year ?? null,
      };
    });
  }
}
