import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification, RealtimeNotificationEvent } from '../services/notificationService';
import { useNotificationContext } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

export interface UseNotificationsReturn {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  isConnected: boolean;
  loadNotifications: (refresh?: boolean) => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  connectRealtime: () => Promise<void>;
  disconnectRealtime: () => void;
  markAsRead: (userNotificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteAll: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { incrementUnreadCount, showToast, isConnected: globalIsConnected, markAsRead: globalMarkAsRead, markAsDeleted: globalMarkAsDeleted, refreshUnreadCount } = useNotificationContext();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Load notifications
  const loadNotifications = useCallback(async (refresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const page = refresh ? 1 : currentPage;
      const response = await notificationService.getNotifications(page, 20);

      if (response.returnCode === 0) {
        const newNotifications = response.data || [];
        
        if (refresh) {
          setNotifications(newNotifications);
          setCurrentPage(1);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
          setCurrentPage(page + 1);
        }


        const totalPages = response.meta?.totalPages || 0;
        setHasMore(page < totalPages);
      } else {
        throw new Error(response.message || 'Failed to load notifications');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);


  const deleteNotification = useCallback(async (id: number) => {
    try {
      // Sử dụng markAsDeleted thay vì xóa thật
      await globalMarkAsDeleted(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      await refreshUnreadCount(); // Refresh unread count sau khi xóa
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      setError(errorMessage);
      console.error('Error deleting notification:', err);
    }
  }, [globalMarkAsDeleted, refreshUnreadCount]);


  const connectRealtime = useCallback(async () => {
    console.log('Realtime connection is managed globally');
  }, []);

  const disconnectRealtime = useCallback(() => {
    console.log('Realtime disconnection is managed globally');
  }, []);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await globalMarkAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
  
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, [globalMarkAsRead, refreshUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, [refreshUnreadCount]);

  const deleteAll = useCallback(async () => {
    try {
      await notificationService.deleteAll();
      setNotifications([]);
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  useEffect(() => {
    if (!globalIsConnected) return;

    const handleRealtimeNotification = (event: RealtimeNotificationEvent) => {
      if (event.type === 'notification' && event.data) {
        setNotifications(prev => {
          const exists = prev.some(n => n.id === event.data!.id);
          if (!exists) {
            return [event.data!, ...prev];
          }
          return prev;
        });
      }
    };

    notificationService.addListener(handleRealtimeNotification);

    return () => {
      notificationService.removeListener(handleRealtimeNotification);
    };
  }, [globalIsConnected]);

  return {
    notifications,
    loading,
    error,
    hasMore,
    isConnected: globalIsConnected,
    loadNotifications,
    deleteNotification,
    connectRealtime,
    disconnectRealtime,
    markAsRead,
    markAllAsRead,
    deleteAll,
  };
}
