import { AdminPermissionRepository } from "@packages/data/repositories/AdminPermissionRepository";
import { AdminType } from "@packages/core/entities/Users";

export class AdminPermissionUseCase {
  private repo: AdminPermissionRepository;

  constructor(repo: AdminPermissionRepository = new AdminPermissionRepository()) {
    this.repo = repo;
  }

  /**
   * Lấy admin_type của một user
   */
  async getAdminType(userId: number): Promise<AdminType | null> {
    return this.repo.getAdminType(userId);
  }

  /**
   * Cập nhật admin_type cho một user
   */
  async updateAdminType(userId: number, adminType: AdminType | null): Promise<void> {
    // Validate adminType
    const validTypes: (AdminType | null)[] = [
      null,
      "super_admin",
      "admin_account",
      "admin_academic",
      "admin_finance",
      "admin",
    ];

    if (!validTypes.includes(adminType)) {
      throw new Error(`Invalid admin_type: ${adminType}`);
    }

    // Kiểm tra user có phải admin không
    const isAdmin = await this.repo.isAdmin(userId);
    if (!isAdmin) {
      throw new Error("User is not an admin");
    }

    return this.repo.updateAdminType(userId, adminType);
  }

  /**
   * Lấy danh sách admin với admin_type, hỗ trợ search và pagination
   */
  async getAllAdminsWithTypes(params?: {
    search?: string;
    adminType?: AdminType | "all";
    page?: number;
    pageSize?: number;
  }) {
    return this.repo.getAllAdminsWithTypes(params);
  }
}

