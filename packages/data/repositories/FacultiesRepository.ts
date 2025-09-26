import { supabase } from "../supabaseClient";

export class FacultiesRepository {
  async getFacultyById(facultyId: number) {
    const { data, error } = await supabase
      .from("faculties")
      .select("id, name, faculty_code, description")
      .eq("id", facultyId)
      .single();

    if (error) throw error;
    return data ?? null;
  }

  async getAllFaculties() {
    const { data, error } = await supabase
      .from("faculties")
      .select("id, name, faculty_code, description")
      .order("id", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }
}
