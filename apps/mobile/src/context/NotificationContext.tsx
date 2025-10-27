import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, RealtimeNotificationEvent } from '../services/notificationService';

interface Notification {
  id: number;
  title?: string;
  content: string;
  type: 'university' | 'lecturer' | 'system' | null;
}

interface NotificationContextType {
  unreadCount: number;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  refreshUnreadCount: () => Promise<void>;
  toastVisible: boolean;
  toastNotification: Notification | null;
  showToast: (notification: Notification) => void;
  hideToast: () => void;
  isConnected: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  markAsDeleted: (notificationId: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  incrementUnreadCount: () => {},
  decrementUnreadCount: () => {},
  resetUnreadCount: () => {},
  refreshUnreadCount: async () => {},
  toastVisible: false,
  toastNotification: null,
  showToast: () => {},
  hideToast: () => {},
  isConnected: false,
  markAsRead: async () => {},
  markAsDeleted: async () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const incrementUnreadCount = () => {
    setUnreadCount(prev => prev + 1);
  };

  const decrementUnreadCount = () => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  const refreshUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      console.log('Refreshed unread count:', count);
    } catch (error) {
      console.error('Error refreshing unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId);
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAsDeleted = async (notificationId: number) => {
    try {
      await notificationService.markAsDeleted(notificationId);
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking notification as deleted:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const loadInitialUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
        console.log('Loaded initial unread count:', count);
      } catch (error) {
        console.error('Error loading initial unread count:', error);
      }
    };

    loadInitialUnreadCount();
  }, [user?.id]);

  const showToast = useCallback((notification: Notification) => {
    setToastNotification(notification);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
    setToastNotification(null);
  }, []);


  useEffect(() => {
    if (!user?.id) {
      console.log('No user ID available for global notifications');
      return;
    }

    console.log('🔌 Setting up global notification realtime for user:', user.id);

    const handleRealtimeNotification = (event: RealtimeNotificationEvent) => {
      if (event.type === 'notification' && event.data) {
        console.log('📨 Global notification received:', event.data);
        // Refresh unread count from server instead of incrementing
        refreshUnreadCount();
        showToast({
          id: event.data.id,
          title: event.data.title || undefined,
          content: event.data.content || 'Bạn có thông báo mới',
          type: event.data.type,
        });
      } else if (event.type === 'connected') {
        console.log('Global notification realtime connected');
      }
    };

    const connectRealtime = async () => {
      try {
        await notificationService.connectRealtime(user.id);
        setIsConnected(true);
        console.log('Global notification realtime connected');

        // Add listener sau khi connect thành công
        notificationService.addListener(handleRealtimeNotification);
      } catch (error) {
        console.error(' Error connecting to global notification realtime:', error);
        setIsConnected(false);
      }
    };

    connectRealtime();

    return () => {
      console.log('🔌 Disconnecting global notification realtime');

      try {
        notificationService.removeListener(handleRealtimeNotification);
        notificationService.disconnect();
        setIsConnected(false);
      } catch (error) {
        console.error('Error disconnecting notification realtime:', error);
      }
    };
  }, [user?.id, refreshUnreadCount, showToast]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      incrementUnreadCount,
      decrementUnreadCount,
      resetUnreadCount,
      refreshUnreadCount,
      toastVisible,
      toastNotification,
      showToast,
      hideToast,
      isConnected,
      markAsRead,
      markAsDeleted,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);
