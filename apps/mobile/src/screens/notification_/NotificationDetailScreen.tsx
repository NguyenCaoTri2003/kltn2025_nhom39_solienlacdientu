import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, MessageSquare, University, AlertCircle, Clock, User } from 'lucide-react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { notificationService } from '../../services/notificationService';
import { useNotificationContext } from '../../context/NotificationContext';
import { useNotifications } from '../../hooks/useNotifications';

dayjs.extend(relativeTime);
dayjs.locale('vi');

interface NotificationDetailScreenProps {
  navigation: any;
  route: {
    params: {
      notification: any;
    };
  };
}

const NotificationDetailScreen: React.FC<NotificationDetailScreenProps> = ({ navigation, route }) => {
  const { notification } = route.params;
  const [isDeleting, setIsDeleting] = useState(false);
  const { markAsRead } = useNotifications();
  
  // Lấy thông tin notification (ưu tiên từ nested object)
  const notificationData = notification.notifications || notification;
  const title = notificationData.title || notification.title || null;
  const content = notificationData.content || notification.content || 'Không có nội dung';
  const type = notificationData.type || notification.type || 'system';
  const category = notificationData.category || notification.category || 'GENERAL';
  const createdAt = notificationData.created_at || notification.created_at;
  const warningLevel = notificationData.warning_level || notification.warning_level;
  
  // Lấy notificationId để mark as read
  const notificationId = notification.id; // ID của notifications record

  // Mark as read khi vào screen
  useEffect(() => {
    if (notificationId && !notification.is_read) {
      markAsRead(notificationId).catch(error => {
        console.error('Error marking notification as read:', error);
      });
    }
  }, [notificationId, notification.is_read, markAsRead]);

  // Tính thời gian
  const createdDate = dayjs(createdAt);
  const now = dayjs();
  const timeDiff = now.diff(createdDate);
  
  const getTimeAgo = () => {
    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return createdDate.format('DD/MM/YYYY HH:mm');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'university':
        return <University size={24} color="#005BAC" />;
      case 'lecturer':
        return <MessageSquare size={24} color="#005BAC" />;
      case 'system':
      default:
        return <Bell size={24} color="#005BAC" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ACADEMIC':
        return <University size={16} color="#059669" />;
      case 'WARNING':
        return <AlertCircle size={16} color="#DC2626" />;
      case 'GENERAL':
      default:
        return <Bell size={16} color="#6B7280" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ACADEMIC':
        return 'Học vụ';
      case 'WARNING':
        return 'Cảnh báo';
      case 'GENERAL':
      default:
        return 'Chung';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'university':
        return 'Trường Đại học';
      case 'lecturer':
        return 'Giảng viên';
      case 'system':
      default:
        return 'Hệ thống';
    }
  };

  const getWarningLevelColor = (level: string) => {
    switch (level) {
      case 'FIRST':
        return '#F59E0B'; 
      case 'SECOND':
        return '#EF4444'; 
      case 'FINAL':
        return '#DC2626'; 
      default:
        return '#6B7280'; 
    }
  };

  const getWarningLevelLabel = (level: string) => {
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

  const handleDeleteNotification = async () => {
    try {
      setIsDeleting(true);
      
      const userNotificationId = notification.id;
      
      if (!userNotificationId) {
        Alert.alert('Lỗi', 'Không thể xác định thông báo cần xóa');
        return;
      }

      await notificationService.deleteNotification(userNotificationId);
      
      Alert.alert(
        'Thành công',
        'Thông báo đã được xóa',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Lỗi', 'Không thể xóa thông báo. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {getNotificationIcon(type)}
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{getTypeLabel(type)}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Clock size={14} color="#6B7280" />
                <Text style={styles.metaText}>{getTimeAgo()}</Text>
              </View>
              <View style={styles.metaItem}>
                {getCategoryIcon(category)}
                <Text style={styles.metaText}>{getCategoryLabel(category)}</Text>
              </View>
            </View>
          </View>
        </View>

        {warningLevel && (
          <View style={[styles.warningBadge, { backgroundColor: getWarningLevelColor(warningLevel) }]}>
            <AlertCircle size={16} color="#FFFFFF" />
            <Text style={styles.warningText}>{getWarningLevelLabel(warningLevel)}</Text>
          </View>
        )}

 
        <View style={styles.contentSection}>
          {title && (
            <>
              <Text style={styles.titleText}>{title}</Text>
            </>
          )}
          <Text style={styles.contentTitle}>Nội dung chi tiết</Text>
          <Text style={styles.contentText}>{content}</Text>
        </View>


        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thông báo từ:</Text>
            <Text style={styles.infoValue}>{getTypeLabel(type)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Danh mục:</Text>
            <Text style={styles.infoValue}>{getCategoryLabel(category)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thời gian:</Text>
            <Text style={styles.infoValue}>{createdDate.format('DD/MM/YYYY HH:mm')}</Text>
          </View>
          
          {warningLevel && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mức độ cảnh báo:</Text>
              <Text style={[styles.infoValue, { color: getWarningLevelColor(warningLevel) }]}>
                {getWarningLevelLabel(warningLevel)}
              </Text>
            </View>
          )}
        </View>


        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.actionButton, isDeleting && styles.actionButtonDisabled]}
            onPress={() => {
              Alert.alert(
                'Xác nhận',
                'Bạn có chắc chắn muốn xóa thông báo này?',
                [
                  { text: 'Hủy', style: 'cancel' },
                  { text: 'Xóa', style: 'destructive', onPress: handleDeleteNotification }
                ]
              );
            }}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>Xóa thông báo</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 12,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  contentSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b71c1c',
    backgroundColor: '#fdecea', // nền đỏ nhạt
    borderWidth: 1,
    borderColor: '#f5c6cb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  
  contentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  actionsSection: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotificationDetailScreen;

