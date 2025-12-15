"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from "@packages/data/supabaseClient";

interface NotificationItem {
  id: number;
  user_id: number | null;
  title: string | null;
  content: string | null;
  type: "university" | "lecturer" | "system" | "parent" | null;
  is_read?: boolean;
  created_at?: string;
}

class NotificationManager {
  private static instance: NotificationManager;
  private listeners: Set<() => void> = new Set();
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private userId: number | null = null;
  private unreadCount = 0;
  private notifications: NotificationItem[] = [];

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  connect(userId: number) {
    if (this.userId === userId && this.channel) return;
    
    this.disconnect();
    this.userId = userId;
    
    this.channel = supabase
      .channel(`notifications_user_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload: { new: NotificationItem }) => {
          const n: NotificationItem = payload?.new;
          this.unreadCount += 1;
          this.notifications = [{ ...n, is_read: false }, ...this.notifications].slice(0, 20);
          this.notifyListeners();
          try { localStorage.setItem('notifications:version', String(Date.now())) } catch {}
        }
      )
      .subscribe();
  }

  disconnect() {
    if (this.channel) {
      try { supabase.removeChannel(this.channel) } catch {}
      this.channel = null;
    }
    this.userId = null;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  getUnreadCount() {
    return this.unreadCount;
  }

  getNotifications() {
    return this.notifications;
  }

  setUnreadCount(count: number) {
    this.unreadCount = count;
    this.notifyListeners();
  }

  setNotifications(notifications: NotificationItem[]) {
    this.notifications = notifications;
    this.unreadCount = notifications.filter(n => !n.is_read).length;
    this.notifyListeners();
  }

  addNotification(notification: NotificationItem) {
    this.notifications = [notification, ...this.notifications].slice(0, 20);
    if (!notification.is_read) {
      this.unreadCount += 1;
    }
    this.notifyListeners();
  }

  markAsRead(id: number) {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, is_read: true } : n
    );
    this.unreadCount = this.notifications.filter(n => !n.is_read).length;
    this.notifyListeners();
  }

  markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, is_read: true }));
    this.unreadCount = 0;
    this.notifyListeners();
  }

  deleteNotification(id: number) {
    const notification = this.notifications.find(n => n.id === id);
    this.notifications = this.notifications.filter(n => n.id !== id);
    if (notification && !notification.is_read) {
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }
    this.notifyListeners();
  }

  deleteAll() {
    this.notifications = [];
    this.unreadCount = 0;
    this.notifyListeners();
  }
}

export function useNotificationManager(userId: number | null) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const manager = NotificationManager.getInstance();

  useEffect(() => {
    if (!userId) return;

    manager.connect(userId);
    
    const unsubscribe = manager.subscribe(() => {
      setUnreadCount(manager.getUnreadCount());
      setNotifications(manager.getNotifications());
    });

    setUnreadCount(manager.getUnreadCount());
    setNotifications(manager.getNotifications());

    return () => {
      unsubscribe();
    };
  }, [userId, manager]);

  const markAsRead = useCallback((id: number) => {
    manager.markAsRead(id);
  }, [manager]);

  const markAllAsRead = useCallback(() => {
    manager.markAllAsRead();
  }, [manager]);

  const deleteNotification = useCallback((id: number) => {
    manager.deleteNotification(id);
  }, [manager]);

  const deleteAll = useCallback(() => {
    manager.deleteAll();
  }, [manager]);

  const setUnreadCountExternal = useCallback((count: number) => {
    manager.setUnreadCount(count);
  }, [manager]);

  const setNotificationsExternal = useCallback((notifications: NotificationItem[]) => {
    manager.setNotifications(notifications);
  }, [manager]);

  return {
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    setUnreadCount: setUnreadCountExternal,
    setNotifications: setNotificationsExternal,
  };
}
