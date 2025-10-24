import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { createSSEStream, createSSEHeaders } from "../helpers/sse-handler";
import { broadcastToUser } from "../helpers/connection-manager";

/**
 * Thiết lập kết nối SSE cho realtime notifications
 * Hỗ trợ token từ query parameter (cho EventSource) hoặc header/cookie
 */
export async function GET(req: NextRequest) {
  try {
    // Thử lấy token từ query parameter trước (cho EventSource)
    const { searchParams } = new URL(req.url);
    const tokenFromQuery = searchParams.get('token');
    
    let user;
    if (tokenFromQuery) {
      // Tạo mock request với token từ query
      const mockReq = {
        headers: new Headers({ 'Authorization': `Bearer ${tokenFromQuery}` }),
        cookies: { get: () => undefined }
      };
      user = authenticate(mockReq as any);
    } else {
      user = await authenticate(req);
    }
    
    // Tạo SSE stream
    const stream = createSSEStream(req, user);
    
    return new Response(stream, {
      headers: createSSEHeaders(),
    });
    
  } catch (error) {
    console.error('SSE connection error:', error);
    return NextResponse.json(
      { error: 'Failed to establish connection' },
      { status: 500 }
    );
  }
}

/**
 * Broadcast thông báo đến user cụ thể
 * Được gọi từ NotificationsUseCase khi tạo thông báo mới
 */
export async function broadcastNotification(userId: number, notification: any) {
  await broadcastToUser(userId, notification);
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
