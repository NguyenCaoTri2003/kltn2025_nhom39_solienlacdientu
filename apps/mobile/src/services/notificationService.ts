import { getAuthToken } from '../utils/auth';
import { API_URL } from '../constants/config';

const API_BASE_URL = API_URL || 'http://localhost:3000';

// Polyfill EventSource cho React Native
if (typeof global !== 'undefined' && !global.EventSource) {
  // Cho React Native, chúng ta sẽ sử dụng phương pháp polling thay vì EventSource
  console.log('EventSource not available, using polling for notifications');
}

export interface Notification {
  id: number;
  user_id: number | null;
  title: string | null;
  content: string | null;
  type: 'university' | 'lecturer' | 'system' | null;
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
  private eventSource: any = null;
  private listeners: ((event: RealtimeNotificationEvent) => void)[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastNotificationId: number | null = null;

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

  async connectRealtime(): Promise<void> {
    try {
      const token = await getAuthToken();

      this.disconnect();


      console.log('Starting polling for notifications...');
      

      const initialResponse = await this.getNotifications(1, 1);
      if (initialResponse.returnCode === 0 && initialResponse.data.length > 0) {
        this.lastNotificationId = initialResponse.data[0].id;
      }


      this.pollingInterval = setInterval(async () => {
        try {
          const response = await this.getNotifications(1, 5); 
          if (response.returnCode === 0 && response.data.length > 0) {
            const newNotifications = response.data.filter(
              (notification) => 
                this.lastNotificationId === null || 
                notification.id > this.lastNotificationId
            );

            if (newNotifications.length > 0) {
              this.lastNotificationId = Math.max(...newNotifications.map(n => n.id));

              newNotifications.forEach(notification => {
                const event: RealtimeNotificationEvent = {
                  type: 'notification',
                  data: notification,
                  timestamp: new Date().toISOString()
                };
                this.notifyListeners(event);
              });
            }
          }
        } catch (error) {
          console.error('Error polling notifications:', error);
        }
      }, 10000); 

      // Gửi event connected
      const connectedEvent: RealtimeNotificationEvent = {
        type: 'connected',
        message: 'Connected to notifications polling',
        timestamp: new Date().toISOString()
      };
      this.notifyListeners(connectedEvent);

    } catch (error) {
      console.error('Error connecting to realtime notifications:', error);
      throw error;
    }
  }


  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
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
    return this.pollingInterval !== null;
  }
}

export const notificationService = new NotificationService();
