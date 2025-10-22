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

  async getSemestersFromYear(startYear: number) {
    const { data, error } = await supabase
      .from("semesters")
      .select("*")
      .gte("academic_year", `${startYear} - 0000`) 
      .order("id", { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

}


