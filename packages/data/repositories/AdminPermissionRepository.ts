import { supabase } from "../supabaseClient";
import { AdminType } from "@packages/core/entities/Users";

export class AdminPermissionRepository {
  /**
   * Lấy admin_type của một user
   */
  async getAdminType(userId: number): Promise<AdminType | null> {
    const { data, error } = await supabase
      .from("users")
      .select("admin_type")
      .eq("id", userId)
      .eq("role", "admin")
      .single();

    if (error || !data) return null;
    return data.admin_type as AdminType | null;
  }

  /**
   * Cập nhật admin_type cho một user
   */
  async updateAdminType(userId: number, adminType: AdminType | null): Promise<void> {
    // Kiểm tra user có phải admin không
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new Error("User not found");
    }

    if (user.role !== "admin") {
      throw new Error("User is not an admin");
    }

    // Cập nhật admin_type
    const { error } = await supabase
      .from("users")
      .update({ admin_type: adminType })
      .eq("id", userId)
      .eq("role", "admin");

    if (error) throw error;
  }

  /**
   * Lấy danh sách admin với admin_type, hỗ trợ search và pagination
   */
  async getAllAdminsWithTypes(params?: {
    search?: string;
    adminType?: AdminType | "all";
    page?: number;
    pageSize?: number;
  }): Promise<{
    items: Array<{ id: number; full_name: string; email: string; admin_type: AdminType | null; status: string }>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("users")
      .select("id, full_name, email, admin_type, status", { count: "exact" })
      .eq("role", "admin");

    // Search theo email hoặc full_name
    if (params?.search) {
      const search = params.search.trim();
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Filter theo admin_type
    if (params?.adminType && params.adminType !== "all") {
      query = query.eq("admin_type", params.adminType);
    }

    // Order và pagination
    query = query.order("id").range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const items = (data || []).map((user: any) => ({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      admin_type: user.admin_type as AdminType | null,
      status: user.status as string,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Kiểm tra xem user có phải admin không
   */
  async isAdmin(userId: number): Promise<boolean> {
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) return false;
    return data.role === "admin";
  }
}

