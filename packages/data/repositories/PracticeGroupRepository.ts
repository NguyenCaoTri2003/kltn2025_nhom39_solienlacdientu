import { supabase } from "../supabaseClient";

export class PracticeGroupRepository {
  async getGroupsByOffering(offeringId: number) {
    const { data, error } = await supabase
      .from("practice_groups")
      .select(
        "id, offering_id, group_number, capacity, registered, schedule, lecturer_id"
      )
      .eq("offering_id", offeringId);

    if (error) throw error;
    return data ?? [];
  }
}


