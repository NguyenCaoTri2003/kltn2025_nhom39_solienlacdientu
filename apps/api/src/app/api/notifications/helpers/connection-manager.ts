/**
 * Quản lý kết nối SSE cho realtime notifications
 */

// Store active connections
const connections = new Map<number, ReadableStreamDefaultController>();

/**
 * Lưu trữ kết nối SSE cho user
 */
export function storeConnection(userId: number, controller: ReadableStreamDefaultController) {
  connections.set(userId, controller);
}

/**
 * Xóa kết nối SSE của user
 */
export function removeConnection(userId: number) {
  connections.delete(userId);
}

/**
 * Lấy controller của user
 */
export function getConnection(userId: number): ReadableStreamDefaultController | undefined {
  return connections.get(userId);
}

/**
 * Broadcast thông báo đến user cụ thể
 */
export async function broadcastToUser(userId: number, notification: any) {
  const controller = getConnection(userId);
  if (controller) {
    try {
      const data = JSON.stringify({
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString()
      });
      controller.enqueue(`data: ${data}\n\n`);
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      removeConnection(userId);
    }
  }
}

/**
 * Gửi heartbeat để giữ kết nối
 */
export function sendHeartbeat(controller: ReadableStreamDefaultController) {
  try {
    const heartbeatData = JSON.stringify({
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    });
    controller.enqueue(`data: ${heartbeatData}\n\n`);
  } catch (error) {
    throw error; // Re-throw để caller có thể handle
  }
}