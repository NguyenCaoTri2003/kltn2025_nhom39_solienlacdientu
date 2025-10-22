import { supabase } from "../supabaseClient";

export class ParentRepository {
  async isParentOf(parentId: number, studentId: number) {
    const { data, error } = await supabase
      .from("student_parent")
      .select("student_id")
      .eq("parent_id", parentId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return !!data;
  }
}
