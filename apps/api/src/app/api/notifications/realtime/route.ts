import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@packages/utils/auth";
import { notificationsUseCase } from "@packages/core/usecases/NotificationsUseCase";

// Store active connections
const connections = new Map<number, ReadableStreamDefaultController>();

export async function GET(req: NextRequest) {
  try {
    // Try to get token from query parameter first (for EventSource)
    const { searchParams } = new URL(req.url);
    const tokenFromQuery = searchParams.get('token');
    
    let user;
    if (tokenFromQuery) {
      // Create a mock request with token from query
      const mockReq = {
        headers: new Headers({ 'Authorization': `Bearer ${tokenFromQuery}` }),
        cookies: { get: () => undefined }
      };
      user = authenticate(mockReq as any);
    } else {
      user = authenticate(req);
    }
    
    // Create SSE connection
    const stream = new ReadableStream({
      start(controller) {
        // Store connection for this user
        connections.set(user.id, controller);
        
        // Send initial connection message
        const data = JSON.stringify({
          type: 'connected',
          message: 'Connected to notifications stream',
          timestamp: new Date().toISOString()
        });
        controller.enqueue(`data: ${data}\n\n`);
        
        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
          try {
            const heartbeatData = JSON.stringify({
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            });
            controller.enqueue(`data: ${heartbeatData}\n\n`);
          } catch (error) {
            clearInterval(heartbeat);
            connections.delete(user.id);
          }
        }, 30000); // 30 seconds heartbeat
        
        // Clean up on close
        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          connections.delete(user.id);
        });
      },
      cancel() {
        connections.delete(user.id);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('SSE connection error:', error);
    return NextResponse.json(
      { error: 'Failed to establish connection' },
      { status: 500 }
    );
  }
}

// Function to broadcast notification to specific user
export async function broadcastNotification(userId: number, notification: any) {
  const controller = connections.get(userId);
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
      connections.delete(userId);
    }
  }
}

export async function OPTIONS() {
  const res = NextResponse.json({}, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}
