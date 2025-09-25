import { supabase } from "../supabaseClient";

export class MajorsRepository {
  async getMajorsByFaculty(facultyId: number) {
    const { data, error } = await supabase
      .from("majors")
      .select("id, name, major_code, description, faculty_id")
      .eq("faculty_id", facultyId);

    if (error) throw error;
    return data ?? [];
  }
}


