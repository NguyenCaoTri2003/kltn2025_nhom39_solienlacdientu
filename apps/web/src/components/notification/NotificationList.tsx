"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellOff, Trash2, AlertCircle, MessageSquare, University, CheckCircle, Trash, Clock, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notificationService } from '../../services/notificationService';
import { useNotificationManager } from "@/hooks/useNotificationManager";
import { useRouter } from 'next/navigation';

interface Notification {
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

 

export default function NotificationList() {
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteAll, setNotifications } = useNotificationManager(userId);
  const notificationsRef = useRef<Notification[]>([]);
  useEffect(() => { notificationsRef.current = notifications; }, [notifications]);
  const initializedRef = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id) setUserId(Number(u.id));
        return;
      }
      const cookieUserRaw = typeof document !== 'undefined'
        ? document.cookie.split('; ').find(r => r.startsWith('user='))?.split('=')[1]
        : undefined;
      if (cookieUserRaw) {
        const u = JSON.parse(decodeURIComponent(cookieUserRaw));
        if (u?.id) setUserId(Number(u.id));
      }
    } catch {}
  }, []);

  const loadNotifications = useCallback(async (refresh = false) => {
    if (!userId) return;
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const page = refresh ? 1 : currentPage;
      const response = await notificationService.getNotifications(page, 20);
      
      if (response.returnCode === 0) {
        const newNotifications = response.data || [];
        const meta = response.meta;
        
        if (refresh) {
          setNotifications(newNotifications);
          setCurrentPage(1);
        } else {
          const base = notificationsRef.current || [];
          const existingIds = new Set(base.map(n => n.id));
          const dedupNew = newNotifications.filter(n => !existingIds.has(n.id));
          setNotifications([...base, ...dedupNew]);
        }
        
        if (meta && typeof meta.totalPages === 'number' && typeof meta.page === 'number') {
          setHasMore(meta.page < meta.totalPages);
        } else {
          setHasMore(newNotifications.length === 20);
        }
        if (!refresh) {
          setCurrentPage(prev => prev + 1);
        }
      } else {
        setError(response.message || 'Không thể tải thông báo');
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Có lỗi xảy ra khi tải thông báo');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [currentPage, userId, setNotifications]);

  const handleRefresh = () => {
    loadNotifications(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(false);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      markAsRead(id);
      try { localStorage.setItem('notifications:version', String(Date.now())) } catch {}
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      markAllAsRead();
      try { localStorage.setItem('notifications:version', String(Date.now())) } catch {}
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeletingAll(true);
      await notificationService.deleteAll();
      deleteAll();
      setShowDeleteAllDialog(false);
      try { localStorage.setItem('notifications:version', String(Date.now())) } catch {}
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    } finally {
      setDeletingAll(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    router.push(`/portal/notifications/${notification.id}`);
  };



  useEffect(() => {
    if (!userId) return;
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadNotifications(true);
  }, [userId, loadNotifications]);

  useEffect(() => {
    let lastVersion: string | null = null;
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'notifications:version' && e.newValue && e.newValue !== lastVersion) {
        lastVersion = e.newValue;
        loadNotifications(true);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);

  }, [loadNotifications]);

  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case 'university':
        return <University className="w-5 h-5 text-blue-600" />;
      case 'lecturer':
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case 'system':
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationTypeLabel = (type: string | null) => {
    switch (type) {
      case 'university':
        return 'Trường đại học';
      case 'lecturer':
        return 'Giảng viên';
      case 'system':
      default:
        return 'Hệ thống';
    }
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Vừa xong' : `${diffInMinutes} phút trước`;
    }
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    }
    if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} ngày trước`;
    }
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông báo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-gray-600">
            {notifications.length} thông báo • {unreadCount} chưa đọc
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleMarkAllAsRead}
            variant="outline"
            size="sm"
            disabled={notifications.every(n => n.is_read)}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Đánh dấu tất cả đã đọc
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDeleteAllDialog(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa tất cả
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BellOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có thông báo</h3>
            <p className="text-gray-600">Bạn sẽ nhận được thông báo mới tại đây</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                !notification.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                        </div>
                        
                        {notification.title && (
                          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                            {notification.title}
                          </h3>
                        )}
                        
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {notification.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(notification.created_at || '')}
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.is_read && (
                          <DropdownMenuItem onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Đánh dấu đã đọc
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                            className="text-red-600"
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* BTN Tải thêm */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button 
                onClick={handleLoadMore} 
                variant="outline" 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Đang tải...' : 'Tải thêm'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Xoá  */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog} className="z-50 w-3">
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa tất cả thông báo</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa tất cả thông báo? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteAllDialog(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingAll ? 'Đang xóa...' : 'Xóa tất cả'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
