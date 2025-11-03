import { NotificationsRepository, type ListParams, type ListResult, type NotificationRow, type NotificationType } from "@packages/data/repositories/NotificationsRepository";
import { UserRepository } from "@packages/data/repositories/UserRepository";
import { NotificationCategory } from "@packages/core/entities/Notifications";

export class NotificationsUseCase {
  private repo: NotificationsRepository;
  private usersRepo: UserRepository;

  constructor(repo?: NotificationsRepository) {
    this.repo = repo ?? new NotificationsRepository();
    this.usersRepo = new UserRepository();
  }

  async list(params: { userId?: number | string; page?: number; pageSize?: number }): Promise<ListResult> {
    const p: ListParams = {
      userId: this.toPositiveInt(params.userId),
      page: this.toPositiveInt(params.page) ?? 1,
      pageSize: Math.min(this.toPositiveInt(params.pageSize) ?? 20, 100),
    };
    return this.repo.list(p);
  }

  async getById(id: number | string): Promise<NotificationRow | null> {
    const nid = this.toPositiveInt(id);
    if (!nid) return null;
    return this.repo.getById(nid);
  }

  /**
   * Tạo thông báo mới
   */
  async create(payload: { 
    user_id?: number | string | null; 
    title?: string | null;
    content?: string | null; 
    type?: NotificationType | null;
    category?: NotificationCategory | null;
    target_student_id?: number | string | null;
    url?: string | null;
  }): Promise<NotificationRow> {

    const user_id = payload.user_id != null ? this.toPositiveInt(payload.user_id) ?? null : null;
    const title = typeof payload.title === "string" ? payload.title : null;
    const content = typeof payload.content === "string" ? payload.content : null;
    const type = (payload.type ?? null) as NotificationType | null;
    const category = (payload.category ?? null) as NotificationCategory | null;
    const target_student_id = payload.target_student_id != null ? this.toPositiveInt(payload.target_student_id) ?? null : null;

    const notification = await this.repo.create({ 
      user_id, 
      title,
      content, 
      type, 
      category,
      target_student_id,
      url: payload.url ?? null
    });
    // Nếu có user_id, broadcast realtime
    if (user_id) {

    }
    
    return notification;
  }

  /**
   * Broadcast: tạo thông báo cho tất cả người dùng (mỗi user một record)
   */
  async createForAll(payload: {
    title: string;
    content: string;
    type?: NotificationType | null;
    category?: NotificationCategory | null;
    url?: string | null;
  }): Promise<{ created: number }> {
    const title = String(payload.title || "").trim();
    const content = String(payload.content || "").trim();
    if (!title && !content) {
      throw new Error("Title or content is required");
    }

    const type = (payload.type ?? "university") as NotificationType | null;
    const category = (payload.category ?? "GENERAL") as NotificationCategory | null;

    const users = await this.usersRepo.getAllUsers();
    const rows = users.map(u => ({
      user_id: Number(u.id),
      title,
      content,
      type,
      category,
      target_student_id: null as number | null,
      url: payload.url ?? null,
    }));

    // dùng "chunking" để chia nhỏ danh sách bản ghi khi broadcast, tránh insert một mẻ quá lớn gây lỗi/timeout
    const chunkSize = 500;
    let created = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      created += await this.repo.createBulk(chunk);
    }
    return { created };
  }

  async delete(id: number | string): Promise<void> {
    const nid = this.toPositiveInt(id);
    if (!nid) return;
    await this.repo.delete(nid);
  }


  // Không sử dụng bảng User_Notifications nữa (tất cả dùng bảng Notifications)
  // async createUserNotification(userId: number, notificationId: number): Promise<UserNotificationRow> {
  //   return await this.repo.createUserNotification(userId, notificationId);
  // }

  async markAsRead(notificationId: number | string): Promise<void> {
    const id = this.toPositiveInt(notificationId);
    if (!id) return;
    await this.repo.markAsRead(id);
  }

  async markAsDeleted(notificationId: number | string): Promise<void> {
    const id = this.toPositiveInt(notificationId);
    if (!id) return;
    await this.repo.markAsDeleted(id);
  }

  async getUserNotifications(userId: number | string, params: { page?: number; pageSize?: number } = {}): Promise<ListResult> {
    const uid = this.toPositiveInt(userId);
    if (!uid) throw new Error("Invalid user ID");
    
    const p: ListParams = {
      page: this.toPositiveInt(params.page) ?? 1,
      pageSize: Math.min(this.toPositiveInt(params.pageSize) ?? 20, 100),
    };
    
    return this.repo.getUserNotifications(uid, p);
  }

  async markAllAsRead(userId: number | string): Promise<void> {
    const uid = this.toPositiveInt(userId);
    if (!uid) throw new Error("Invalid user ID");
    await this.repo.markAllAsRead(uid);
  }

  async deleteAll(userId: number | string): Promise<void> {
    const uid = this.toPositiveInt(userId);
    if (!uid) throw new Error("Invalid user ID");
    await this.repo.deleteAll(uid);
  }


  private toPositiveInt(v: any): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  }
}

export const notificationsUseCase = new NotificationsUseCase();
