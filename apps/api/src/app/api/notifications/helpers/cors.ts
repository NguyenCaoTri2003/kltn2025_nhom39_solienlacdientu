import { NextResponse } from "next/server";

/**
 * Tạo CORS headers cho notification endpoints
 */
export function createCorsHeaders(methods: string = "GET,OPTIONS") {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

/**
 * Áp dụng CORS headers vào response
 */
export function applyCorsHeaders(response: NextResponse, methods: string = "GET,OPTIONS") {
  const headers = createCorsHeaders(methods);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
