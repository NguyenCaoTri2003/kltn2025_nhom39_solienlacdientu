import { supabase } from "@packages/data/supabaseClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  warning_level?: string;
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
  notification?: Notification;
}

type SupabaseChannel = ReturnType<typeof supabase.channel>;

class NotificationService {
  private listeners: ((event: RealtimeNotificationEvent) => void)[] = [];
  private channels: Map<string, SupabaseChannel> = new Map();

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    
    return cookieToken || localStorage.getItem('token');
  }

  async getNotifications(page: number = 1, pageSize: number = 20): Promise<NotificationResponse> {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/api/user-notifications?page=${page}&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/api/user-notifications`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: notificationId,
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

  async getUnreadCount(): Promise<number> {
    try {
      const token = this.getToken();
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

  async markAsRead(notificationId: number): Promise<void> {
    try {
      const token = this.getToken();
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
      const token = this.getToken();
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

  async markAllAsRead(): Promise<void> {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/api/user-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markAllAsRead',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.returnCode !== 0) {
        throw new Error(data.message || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteAll(): Promise<void> {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/api/user-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteAll',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.returnCode !== 0) {
        throw new Error(data.message || 'Failed to delete all notifications');
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  async connectRealtime(userId: number): Promise<void> {
    try {
      this.disconnect();

      const channelName = `notifications_user_${userId}`;
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const notification = payload.new as Notification;
            
            if (notification.user_id === userId) {
              this.listeners.forEach(listener => {
                listener({
                  type: 'notification',
                  notification: notification
                });
              });
            }
          }
        )
        .subscribe();

      this.channels.set(channelName, channel);
    } catch (error) {
      console.error('Error connecting to realtime:', error);
    }
  }

  addListener(listener: (event: RealtimeNotificationEvent) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (event: RealtimeNotificationEvent) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  disconnect(): void {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const notificationService = new NotificationService();
