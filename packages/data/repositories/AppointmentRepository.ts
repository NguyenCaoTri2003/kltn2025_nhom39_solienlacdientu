import { supabase } from "../supabaseClient";

export class AppointmentRepository {
  async createAppointments(records: any[]) {
    const { data, error } = await supabase
      .from("appointments")
      .insert(records)
      .select();

    if (error) throw error;
    return data;
  }

  async getAppointmentsByUser(userId: number, role: string) {
    let query = supabase.from("appointments").select(`
      *,
      lecturer:lecturer_id (id, users (full_name)),
      parent:parent_id (id, users (full_name)),
      student:student_id (id, users (full_name))
    `);

    if (role === "lecturer") {
      query = query.eq("lecturer_id", userId);
    } else if (role === "parent") {
      query = query.eq("parent_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async updateAppointment(
    id: number,
    updates: Partial<{
      title: string;
      content: string;
      start_time: string;
      end_time: string;
      status: string;
      location: string;
    }>
  ) {
    const { data, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAppointment(id: number) {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throw error;
    return true;
  }
}
