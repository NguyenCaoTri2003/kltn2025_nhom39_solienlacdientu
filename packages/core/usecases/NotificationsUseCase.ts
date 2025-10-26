import { NotificationsRepository, type ListParams, type ListResult, type NotificationRow, type NotificationType, type UserNotificationRow } from "@packages/data/repositories/NotificationsRepository";
import { NotificationCategory } from "@packages/core/entities/Notifications";
import { NotificationBroadcaster } from "./helpers/NotificationBroadcaster";

export class NotificationsUseCase {
  private repo: NotificationsRepository;

  constructor(repo?: NotificationsRepository) {
    this.repo = repo ?? new NotificationsRepository();
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
   * Tự động tạo user notification record và broadcast realtime
   */
  async create(payload: { 
    user_id?: number | string | null; 
    title?: string | null;
    content?: string | null; 
    type?: NotificationType | null;
    category?: NotificationCategory | null;
    target_student_id?: number | string | null;
  }): Promise<NotificationRow> {
    // Validate và parse input
    const user_id = payload.user_id != null ? this.toPositiveInt(payload.user_id) ?? null : null;
    const title = typeof payload.title === "string" ? payload.title : null;
    const content = typeof payload.content === "string" ? payload.content : null;
    const type = (payload.type ?? null) as NotificationType | null;
    const category = (payload.category ?? null) as NotificationCategory | null;
    const target_student_id = payload.target_student_id != null ? this.toPositiveInt(payload.target_student_id) ?? null : null;
    
    // Tạo notification record
    const notification = await this.repo.create({ 
      user_id, 
      title,
      content, 
      type, 
      category,
      target_student_id
    });
    
    // Nếu có user_id, tạo user notification và broadcast
    if (user_id) {
      // Tạo user notification record (async, không block)
      NotificationBroadcaster.createUserNotificationRecord(
        this.repo, 
        user_id, 
        notification.id
      );
      
      // Broadcast realtime (async, không block)
      NotificationBroadcaster.broadcastToUser(user_id, notification);
    }
    
    return notification;
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


  // DEPRECATED: Use notifications table directly
  // async createUserNotifications(notificationId: number, userIds: number[]): Promise<void> {
  //   if (!userIds || userIds.length === 0) return;
  //   
  //   // Tạo user notification records cho tất cả users
  //   for (const userId of userIds) {
  //     try {
  //       await this.repo.createUserNotification(userId, notificationId);
  //       
  //       // Broadcast realtime cho từng user
  //       const notification = await this.getById(notificationId);
  //       if (notification) {
  //         NotificationBroadcaster.broadcastToUser(userId, notification);
  //       }
  //     } catch (err) {
  //       console.warn(`Failed to create user notification for user ${userId}:`, err);
  //     }
  //   }
  // }

  private toPositiveInt(v: any): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  }
}

export const notificationsUseCase = new NotificationsUseCase();
