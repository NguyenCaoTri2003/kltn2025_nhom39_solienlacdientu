import { supabase } from "../supabaseClient";

export class SemesterSummaryRepository {
  async getByStudentAndSemester(student_id: number, semester_id: number) {
    const { data, error } = await supabase
      .from("semester_summary")
      .select("*")
      .eq("student_id", student_id)
      .eq("semester_id", semester_id)
      // .single();
       .maybeSingle(); 

    if (error) throw error;
    return data;
  }

  async getAllByStudent(student_id: number) {
    const { data, error } = await supabase
      .from("semester_summary")
      .select("*, semesters(name, academic_year, start_date, end_date)")
      .eq("student_id", student_id)
      .order("semester_id", { ascending: true });

    if (error) throw error;
    return data;
  }
}
