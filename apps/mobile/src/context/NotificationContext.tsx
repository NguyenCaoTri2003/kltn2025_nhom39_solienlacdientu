import React, { createContext, useContext, useState, useCallback } from 'react';

interface Notification {
  id: number;
  title?: string;
  content: string;
  type: 'university' | 'lecturer' | 'system' | null;
}

interface NotificationContextType {
  unreadCount: number;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  toastVisible: boolean;
  toastNotification: Notification | null;
  showToast: (notification: Notification) => void;
  hideToast: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  incrementUnreadCount: () => {},
  resetUnreadCount: () => {},
  toastVisible: false,
  toastNotification: null,
  showToast: () => {},
  hideToast: () => {},
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);

  const incrementUnreadCount = () => {
    setUnreadCount(prev => prev + 1);
  };

  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  const showToast = useCallback((notification: Notification) => {
    setToastNotification(notification);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
    setToastNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      incrementUnreadCount,
      resetUnreadCount,
      toastVisible,
      toastNotification,
      showToast,
      hideToast,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => useContext(NotificationContext);
