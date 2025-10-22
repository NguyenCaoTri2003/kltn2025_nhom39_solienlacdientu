import { supabase } from "../supabaseClient";

export class ParentRepository {
  async getChildrenByParentId(parentId: number) {
    const { data, error } = await supabase
      .from("student_parent")
      .select("student_id")
      .eq("parent_id", parentId);

    if (error) throw new Error(error.message);
    return data || [];
  }
}
