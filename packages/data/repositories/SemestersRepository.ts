import { supabase } from "../supabaseClient";

export class SemestersRepository {
  async getSemesters() {
    const { data, error } = await supabase
      .from("semesters")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }
}


