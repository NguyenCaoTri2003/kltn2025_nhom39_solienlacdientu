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
}

export function useNotifications(): UseNotificationsReturn {
  const { incrementUnreadCount, showToast, isConnected: globalIsConnected } = useNotificationContext();
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
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
      setError(errorMessage);
      console.error('Error deleting notification:', err);
    }
  }, []);


  const connectRealtime = useCallback(async () => {
    console.log('Realtime connection is managed globally');
  }, []);

  const disconnectRealtime = useCallback(() => {
    console.log('Realtime disconnection is managed globally');
  }, []);

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
  };
}
