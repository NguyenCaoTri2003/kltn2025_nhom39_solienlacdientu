import { supabase } from "../supabaseClient";

export class SemestersRepository {
  async getSemesters() {
    const { data, error } = await supabase
      .from("semesters")
      .select("id, name, academic_year")
      .order("id", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }
}


