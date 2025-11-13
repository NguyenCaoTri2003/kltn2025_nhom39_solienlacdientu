import { supabase } from "../supabaseClient";

export class InvoiceRepository {
  async getInvoicesBySemester(studentId: number, semesterId: number) {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        id,
        amount,
        due_date,
        status,
        enrollment:enrollment_id (
          id,
          offering:offering_id (
            id,
            name,
            class_code,
            semester_id
          )
        )
      `)
      .eq("enrollment.student_id", studentId)
      .eq("enrollment.offering.semester_id", semesterId);

    if (error) throw new Error(error.message);

    // Lọc những invoice có học kỳ đúng (vì nested filter đôi khi Supabase chưa ổn)
    return (
      data?.filter(
        (inv) => inv.enrollment?.offering?.semester_id === semesterId
      ) ?? []
    );
  }
}
