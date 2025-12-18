"use client";

import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, University, AlertCircle, Clock, User, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { notificationService } from '../../services/notificationService';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Image from "next/image";
import Loading from "@/components/ui/loading";

interface Notification {
  id: number;
  user_id: number | null;
  title: string | null;
  content: string | null;
  type: 'university' | 'lecturer' | 'system' | 'parent' | null;
  category?: string | null;
  target_student_id?: number | null;
  is_read?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  warning_level?: string;
  url?: string | null;
}

export default function NotificationDetail() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { id } = params;

  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getNotificationsPath = () => {
    const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    
    if (currentPath.startsWith("/lecturer")) return "/lecturer/notifications";
    if (currentPath.startsWith("/admin")) return "/admin/notifications";
    return "/portal/notifications"; 
  };

  const getAppointmentsPath = () => {
    const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    if (currentPath.startsWith("/lecturer")) return "/lecturer/appointments";
    // hiện tại chỉ có portal & lecturer có trang lịch hẹn
    return "/portal/appointments";
  };

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await notificationService.getNotifications(1, 100);
        
        if (response.returnCode === 0) {
          const foundNotification = response.data?.find((n: Notification) => n.id === parseInt(String(id)));
          if (foundNotification) {
            setNotification(foundNotification);

            if (!foundNotification.is_read) {
              await notificationService.markAsRead(foundNotification.id);
            }
          } else {
            setError('Không tìm thấy thông báo');
          }
        } else {
          setError(response.message || 'Không thể tải thông báo');
        }
      } catch (err) {
        console.error('Error fetching notification:', err);
        setError('Có lỗi xảy ra khi tải thông báo');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNotification();
    }
  }, [id]);

  const handleDeleteNotification = async () => {
    if (!notification) return;
    
    try {
      setIsDeleting(true);
      await notificationService.deleteNotification(notification.id);
      try { localStorage.setItem('notifications:version', String(Date.now())) } catch {}
      router.push(getNotificationsPath());
    } catch (error) {
      console.error('Error deleting notification:', error);

      setError('Không thể xóa thông báo. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const getNotificationIcon = (type: string | null | undefined) => {
    switch (type) {
      case 'university':
        return <University className="w-6 h-6 text-blue-600" />;
      case 'lecturer':
        return <MessageSquare className="w-6 h-6 text-green-600" />;
      case 'parent':
        return <User className="w-6 h-6 text-purple-600" />;
      case 'system':
      default:
        return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  const getNotificationTypeLabel = (type: string | null | undefined) => {
    switch (type) {
      case 'university':
        return 'Trường Đại học';
      case 'lecturer':
        return 'Giảng viên';
      case 'parent':
        return 'Phụ huynh';
      case 'system':
      default:
        return 'Hệ thống';
    }
  };

  const getCategoryLabel = (category: string | null | undefined) => {
    switch (category) {
      case 'APPOINTMENT':
        return 'Lịch hẹn';
      case 'ACADEMIC':
        return 'Học vụ';
      case 'WARNING':
        return 'Cảnh báo';
      case 'GENERAL':
      default:
        return 'Chung';
    }
  };

  const getWarningLevelColor = (level: string | null | undefined) => {
    switch (level) {
      case 'FIRST':
        return 'bg-yellow-500';
      case 'SECOND':
        return 'bg-orange-500';
      case 'FINAL':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getWarningLevelLabel = (level: string | null | undefined) => {
    switch (level) {
      case 'FIRST':
        return 'Cảnh báo lần 1';
      case 'SECOND':
        return 'Cảnh báo lần 2';
      case 'FINAL':
        return 'Cảnh báo cuối cùng';
      default:
        return 'Thông báo';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
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
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading text="Đang tải thông báo..." />
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error || 'Không tìm thấy thông báo'}</p>
        <Button onClick={() => router.push(getNotificationsPath())} variant="outline">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">

      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(getNotificationsPath())}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết thông báo</h1>
        </div>
      </div>


      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                {getNotificationIcon(notification.type)}
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Thông báo từ {getNotificationTypeLabel(notification.type)}
              </h2>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {getTimeAgo(notification.created_at || '')}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {getCategoryLabel(notification.category)}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {getNotificationTypeLabel(notification.type)}
                </Badge>
                {notification.category && (
                  <Badge variant="outline">
                    {getCategoryLabel(notification.category)}
                  </Badge>
                )}
                {notification.warning_level && (
                  <Badge 
                    className={`text-white ${getWarningLevelColor(notification.warning_level)}`}
                  >
                    {getWarningLevelLabel(notification.warning_level)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {notification.warning_level && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className={`flex items-center gap-2 p-3 rounded-lg text-white ${getWarningLevelColor(notification.warning_level)}`}>
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">
                {getWarningLevelLabel(notification.warning_level)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Nội dung thông báo</CardTitle>
        </CardHeader>
        <CardContent>
          {notification.title && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {notification.title}
              </h3>
            </div>
          )}
          
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">
              {notification.content || 'Không có nội dung'}
            </p>
          </div>

          {notification.url && (
            <div className="mt-4 flex justify-center">
              <Image
                src={notification.url}
                alt="Notification image"
                className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                width={800}
                height={600}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
                unoptimized
              />
            </div>
          )}

          {notification.category === "APPOINTMENT" && (
            <div className="mt-6 flex justify-end">
              <Button onClick={() => router.push(getAppointmentsPath())}>
                Đi tới trang lịch hẹn
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Thông tin chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Thông báo từ:</span>
              <span className="text-sm font-medium text-gray-900">
                {getNotificationTypeLabel(notification.type)}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Danh mục:</span>
              <span className="text-sm font-medium text-gray-900">
                {getCategoryLabel(notification.category)}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Thời gian:</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(notification.created_at || '')}
              </span>
            </div>
            
            {notification.warning_level && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Mức độ cảnh báo:</span>
                <span className={`text-sm font-medium ${getWarningLevelColor(notification.warning_level)} text-white px-2 py-1 rounded`}>
                  {getWarningLevelLabel(notification.warning_level)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isDeleting ? 'Đang xóa...' : 'Xóa thông báo'}
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa thông báo</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleDeleteNotification}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
