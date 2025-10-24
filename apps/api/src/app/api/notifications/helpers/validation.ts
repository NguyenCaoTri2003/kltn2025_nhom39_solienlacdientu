/**
 * Validation helpers cho notification system
 */

/**
 * Kiểm tra và parse page parameter
 */
export function parsePageParam(pageParam: string | null): number | undefined {
  if (!pageParam) return undefined;
  const page = Number(pageParam);
  return Number.isFinite(page) && page > 0 ? page : undefined;
}

/**
 * Kiểm tra và parse pageSize parameter
 */
export function parsePageSizeParam(pageSizeParam: string | null): number | undefined {
  if (!pageSizeParam) return undefined;
  const pageSize = Number(pageSizeParam);
  return Number.isFinite(pageSize) && pageSize > 0 ? Math.min(pageSize, 100) : undefined;
}

/**
 * Kiểm tra và parse userId parameter
 */
export function parseUserIdParam(userIdParam: string | null): number | undefined {
  if (!userIdParam) return undefined;
  const userId = Number(userIdParam);
  return Number.isFinite(userId) && userId > 0 ? userId : undefined;
}

/**
 * Validate notification creation payload
 */
export function validateNotificationPayload(body: any) {
  const { userId, content, type = "system", category = "ACADEMIC" } = body;
  
  if (!userId || !content) {
    throw new Error("Missing userId or content");
  }
  
  return {
    userId: Number(userId),
    content,
    type,
    category
  };
}
