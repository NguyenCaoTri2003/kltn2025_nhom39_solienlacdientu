import { NextResponse } from "next/server";
import { applyCorsHeaders } from "./cors";

/**
 * Xử lý lỗi cho notification endpoints
 */
export function handleNotificationError(
  error: unknown, 
  methods: string = "GET,OPTIONS"
): NextResponse {
  const message = error instanceof Error ? error.message : "System error";
  
  // Xác định loại lỗi
  const isUnauthorized = message === "No token" || 
                        message === "Invalid token" || 
                        message === "Token expired";
  
  const status = isUnauthorized ? 401 : 500;
  
  const response = NextResponse.json(
    { 
      returnCode: -1, 
      message, 
      data: null 
    }, 
    { status }
  );
  
  return applyCorsHeaders(response, methods);
}

/**
 * Tạo response thành công cho notification
 */
export function createSuccessResponse(
  data: any, 
  message: string = "OK", 
  meta?: any,
  methods: string = "GET,OPTIONS"
): NextResponse {
  const response = NextResponse.json(
    { 
      returnCode: 0, 
      message, 
      data, 
      ...(meta && { meta })
    }, 
    { status: 200 }
  );
  
  return applyCorsHeaders(response, methods);
}
