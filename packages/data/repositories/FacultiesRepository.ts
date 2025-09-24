import { supabase } from "../supabaseClient";

export class FacultiesRepository {
  async getFaculties(faculty_id: number) {
    const { data, error } = await supabase
      .from("faculties")
      .select("id, name, faculty_code, description")
      .eq("id", faculty_id);

    if (error) throw error;
    return data ?? [];
  }
}
