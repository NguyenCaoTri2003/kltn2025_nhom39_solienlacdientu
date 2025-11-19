import { supabase } from "../supabaseClient";

export class TuitionFeesRepository {
  async getFees(studentId: number, semesterId: number | null) {
    let query = supabase
      .from("tuition_fees")
      .select(`
        id,
        fee_type,
        fee_code,
        description,
        credit,
        base_amount,
        discount_percent,
        discount_amount,
        payable_amount,
        paid_amount,
        plus_amount,
        minus_amount,
        debt_amount,
        status,
        paid_date,
        semester_id,
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
      .eq("student_id", studentId);

    if (semesterId) {
      query = query.eq("semester_id", semesterId);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);

    return (
      data?.filter((f) => {
        // Nếu có enrollment → check offering.semester_id cho chắc
        const enrollment = f.enrollment?.[0];
        const offering = enrollment?.offering?.[0];

        if (semesterId && offering) {
          return offering.semester_id === semesterId;
        }

        return true; // nếu lấy all
      }) ?? []
    );
  }
}
