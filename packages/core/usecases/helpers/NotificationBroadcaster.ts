/**
 * Helper class để xử lý broadcast notifications
 * Tách riêng logic broadcast để dễ test và maintain
 */

export class NotificationBroadcaster {
  /** Broadcast thông báo đến user thông qua SSE */
  static async broadcastToUser(userId: number, notification: any): Promise<void> {
    try {
      const { broadcastNotification } = await import("../../../../apps/api/src/app/api/notifications/realtime/route");
      await broadcastNotification(userId, notification);
    } catch (error) {
      console.warn("Failed to broadcast notification:", error);
      // Không throw error để không làm gián đoạn flow chính
    }
  }

  // DEPRECATED: Không còn cần tạo user notification record riêng
  // /** Tạo user notification record trong database*/
  // static async createUserNotificationRecord(
  //   repo: any, 
  //   userId: number, 
  //   notificationId: number
  // ): Promise<void> {
  //   try {
  //     await repo.createUserNotification(userId, notificationId);
  //   } catch (error) {
  //     console.warn(`Failed to create user notification for user ${userId}:`, error);
  //     // Không throw error để không làm gián đoạn flow chính
  //   }
  // }
}
