import { NextRequest } from "next/server";
import { storeConnection, removeConnection, sendHeartbeat } from "./connection-manager";

/**
 * Tạo SSE stream cho realtime notifications
 */
export function createSSEStream(req: NextRequest, user: any) {
  return new ReadableStream({
    start(controller) {
      // Lưu trữ kết nối
      storeConnection(user.id, controller);
      
      // Gửi thông báo kết nối thành công
      const connectionData = JSON.stringify({
        type: 'connected',
        message: 'Connected to notifications stream',
        timestamp: new Date().toISOString()
      });
      controller.enqueue(`data: ${connectionData}\n\n`);
      
      // Thiết lập heartbeat để giữ kết nối
      const heartbeat = setInterval(() => {
        try {
          sendHeartbeat(controller);
        } catch (error) {
          clearInterval(heartbeat);
          removeConnection(user.id);
        }
      }, 30000); // 30 giây heartbeat
      
      // Cleanup khi kết nối đóng
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        removeConnection(user.id);
      });
    },
    cancel() {
      removeConnection(user.id);
    }
  });
}

/**
 * Tạo SSE response headers
 */
export function createSSEHeaders() {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}