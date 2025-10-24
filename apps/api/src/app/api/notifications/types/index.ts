/**
 * Types và interfaces cho notification system
 */

export interface NotificationResponse {
  returnCode: number;
  message: string;
  data: any;
  meta?: {
    total?: number;
    totalPages?: number;
    page?: number;
    pageSize?: number;
    executionTime?: string;
  };
}

export interface NotificationListParams {
  userId?: number;
  page?: number;
  pageSize?: number;
}

export interface NotificationCreatePayload {
  userId: number;
  content: string;
  type?: string;
  category?: string;
}

export interface SSEMessage {
  type: 'connected' | 'notification' | 'heartbeat';
  message?: string;
  data?: any;
  timestamp: string;
}

export interface ConnectionInfo {
  userId: number;
  controller: ReadableStreamDefaultController;
  connectedAt: Date;
}
