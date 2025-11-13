import { InvoiceRepository } from "@packages/data/repositories/InvoicesRepository";

export class InvoicesUseCase {
  private repo: InvoiceRepository;

  constructor() {
    this.repo = new InvoiceRepository();
  }

  async execute(studentId: number, semesterId: number) {
    if (!studentId || !semesterId) {
      throw new Error("Thiếu studentId hoặc semesterId");
    }

    const invoices = await this.repo.getInvoicesBySemester(
      studentId,
      semesterId
    );

    return invoices.map((inv) => ({
      id: inv.id,
      amount: inv.amount,
      due_date: inv.due_date,
      status: inv.status,
      course_name: inv.enrollment?.offering?.name ?? null,
      class_code: inv.enrollment?.offering?.class_code ?? null,
    }));
  }
}
