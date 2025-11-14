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
      .eq("enrollment.offering.semester_id", semesterId)

    if (error) throw new Error(error.message);

    return (
      data?.filter((inv) => {
        const enrollment = inv.enrollment?.[0];
        const offering = enrollment?.offering?.[0];

        return offering?.semester_id === semesterId;
      }) ?? []
    );
  }
}
