import { NotificationsRepository, type ListParams, type ListResult, type NotificationRow, type NotificationType, type UserNotificationRow } from "@packages/data/repositories/NotificationsRepository";
import { NotificationCategory } from "@packages/core/entities/Notifications";

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

  async create(payload: { 
    user_id?: number | string | null; 
    content?: string | null; 
    type?: NotificationType | null;
    category?: NotificationCategory | null;
  }): Promise<NotificationRow> {
    const user_id = payload.user_id != null ? this.toPositiveInt(payload.user_id) ?? null : null;
    const content = typeof payload.content === "string" ? payload.content : null;
    const type = (payload.type ?? null) as NotificationType | null;
    const category = (payload.category ?? null) as NotificationCategory | null;
    
    const notification = await this.repo.create({ 
      user_id, 
      content, 
      type, 
      category
    });
    
  
    if (user_id) {
      try {
        await this.repo.createUserNotification(user_id, notification.id);
        
        // Broadcast to realtime connections
        try {
          const { broadcastNotification } = await import("../../../apps/api/src/app/api/notifications/realtime/route");
          await broadcastNotification(user_id, notification);
        } catch (error) {
          console.warn("Failed to broadcast notification:", error);
        }
      } catch (error) {
        console.warn(`Failed to create user notification for user ${user_id}:`, error);
      }
    }
    
    return notification;
  }

  async delete(id: number | string): Promise<void> {
    const nid = this.toPositiveInt(id);
    if (!nid) return;
    await this.repo.delete(nid);
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

  async markAsRead(userNotificationId: number | string): Promise<void> {
    const id = this.toPositiveInt(userNotificationId);
    if (!id) return;
    await this.repo.markAsRead(id);
  }

  async markAsDeleted(userNotificationId: number | string): Promise<void> {
    const id = this.toPositiveInt(userNotificationId);
    if (!id) return;
    await this.repo.markAsDeleted(id);
  }

  private toPositiveInt(v: any): number | undefined {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  }
}

export const notificationsUseCase = new NotificationsUseCase();
