import { getAuthToken } from '../utils/auth';
import { API_URL } from '../constants/config';
import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = API_URL || 'http://localhost:3000';

export interface Notification {
  id: number;
  user_id: number | null;
  title: string | null;
  content: string | null;
  type: 'university' | 'lecturer' | 'system' | null;
  category?: string | null;
  target_student_id?: number | null;
  is_read?: boolean;
  is_deleted?: boolean;
  created_at?: string;
}

export interface NotificationResponse {
  returnCode: number;
  message: string;
  data: Notification[];
  meta?: {
    total: number;
    totalPages: number;
    page: number;
    pageSize: number;
    executionTime: string;
  };
}

export interface RealtimeNotificationEvent {
  type: 'connected' | 'notification' | 'heartbeat';
  data?: Notification;
  message?: string;
  timestamp: string;
}

class NotificationService {
  private listeners: ((event: RealtimeNotificationEvent) => void)[] = [];
  private channels: Map<string, any> = new Map();

  // Lấy notifications với phân trang
  async getNotifications(page: number = 1, pageSize: number = 20): Promise<NotificationResponse> {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/user-notifications?page=${page}&pageSize=${pageSize}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Xoá notification (mark as deleted)
  async deleteNotification(userNotificationId: number): Promise<void> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/user-notifications`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userNotificationId: userNotificationId,
          action: 'markAsDeleted'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Lấy số lượng notifications chưa đọc
  async getUnreadCount(): Promise<number> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/user-notifications/unread-count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Đánh dấu notification đã đọc
  async markAsRead(notificationId: number): Promise<void> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/user-notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: notificationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.returnCode !== 0) {
        throw new Error(data.message || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAsDeleted(notificationId: number): Promise<void> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/user-notifications`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: notificationId,
          action: 'markAsDeleted',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.returnCode !== 0) {
        throw new Error(data.message || 'Failed to mark as deleted');
      }
    } catch (error) {
      console.error('Error marking notification as deleted:', error);
      throw error;
    }
  }

  async connectRealtime(userId: number): Promise<void> {
    try {
      this.disconnect();

      console.log('🔌 Connecting to Supabase realtime notifications for user:', userId);

      const channelName = `notifications:user-${userId}`;
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
          },
          (payload) => {
            console.log('New notification received via realtime:', payload);
            
            const notification = payload.new;
            
            // Chỉ xử lý notification của user hiện tại
            if (notification.user_id === userId) {
              console.log('Processing notification for current user');
              console.log('Notification details:', notification);
              
              const event: RealtimeNotificationEvent = {
                type: 'notification',
                data: notification as Notification,
                timestamp: new Date().toISOString()
              };
              console.log('Sending event to listeners:', event);
              this.notifyListeners(event);
            } else {
              console.log('Skipping notification for different user');
            }
          }
        )
        .subscribe((status) => {
          console.log('Notification channel status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully connected to Supabase realtime notifications');
            const connectedEvent: RealtimeNotificationEvent = {
              type: 'connected',
              message: 'Connected to Supabase realtime notifications',
              timestamp: new Date().toISOString()
            };
            this.notifyListeners(connectedEvent);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error - check RLS policies');
          } else if (status === 'TIMED_OUT') {
            console.error('Channel timed out');
          } else if (status === 'CLOSED') {
            console.log('Channel closed');
          }
        });

      this.channels.set(channelName, channel);

    } catch (error) {
      console.error('Error connecting to realtime notifications:', error);
      throw error;
    }
  }


  disconnect(): void {
    // Disconnect tất cả channels
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
      console.log(`Disconnected channel: ${channelName}`);
    });
    this.channels.clear();
  }

  addListener(listener: (event: RealtimeNotificationEvent) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (event: RealtimeNotificationEvent) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(event: RealtimeNotificationEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  isConnected(): boolean {
    return this.channels.size > 0;
  }
}

export const notificationService = new NotificationService();

