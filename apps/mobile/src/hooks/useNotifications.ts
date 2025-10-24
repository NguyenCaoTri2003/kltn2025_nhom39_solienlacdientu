import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification, RealtimeNotificationEvent } from '../services/notificationService';
import { useNotificationContext } from '../context/NotificationContext';

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
  const { incrementUnreadCount } = useNotificationContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
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

        // Check if there are more notifications
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

  // Delete notification
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

  // Connect to realtime notifications
  const connectRealtime = useCallback(async () => {
    try {
      await notificationService.connectRealtime();
      setIsConnected(true);

      // Add listener for new notifications
      const handleRealtimeNotification = (event: RealtimeNotificationEvent) => {
        if (event.type === 'notification' && event.data) {
          setNotifications(prev => {
            // Check if notification already exists to avoid duplicates
            const exists = prev.some(n => n.id === event.data!.id);
            if (!exists) {
              incrementUnreadCount(); // Increment unread count
              return [event.data!, ...prev];
            }
            return prev;
          });
        } else if (event.type === 'connected') {
          console.log('Connected to realtime notifications');
        }
      };

      notificationService.addListener(handleRealtimeNotification);
    } catch (err) {
      console.error('Error connecting to realtime notifications:', err);
      setError('Failed to connect to realtime notifications');
      setIsConnected(false);
    }
  }, []);

  // Disconnect from realtime notifications
  const disconnectRealtime = useCallback(() => {
    notificationService.disconnect();
    setIsConnected(false);
  }, []);

  // Load initial notifications
  useEffect(() => {
    loadNotifications(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectRealtime();
    };
  }, [disconnectRealtime]);

  return {
    notifications,
    loading,
    error,
    hasMore,
    isConnected,
    loadNotifications,
    deleteNotification,
    connectRealtime,
    disconnectRealtime,
  };
}
