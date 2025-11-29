import { supabase } from "../supabaseClient";

export class MajorsRepository {

  // lấy majors (chuyên ngành) theo facultyId (Khoa)
  async getMajorsByFaculty(facultyId: number) {
    const { data, error } = await supabase
      .from("majors")
      .select("id, name, major_code, description, faculty_id")
      .eq("faculty_id", facultyId);

    if (error) throw error;
    return data ?? [];
  }

  // lấy major (chuyên ngành) theo id
  async getMajorById(majorId: number) {
    const { data, error } = await supabase
      .from("majors")
      .select("id, name, major_code, description, faculty_id")
      .eq("id", majorId)
      .single(); // chỉ lấy 1 record

    if (error) throw error;
    return data ?? null;
  }

  // lấy tất cả majors (chuyên ngành)
  async getAllMajors() {
    const { data, error } = await supabase
      .from("majors")
      .select("id, name, major_code, description, faculty_id")
      .order("name", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }
}


