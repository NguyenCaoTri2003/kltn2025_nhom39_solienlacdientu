import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { ArrowLeft, Bell, MessageSquare, University, AlertTriangle, CreditCard, Info, Clock } from 'lucide-react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { translateWarningLevel } from '@packages/utils/translations';

dayjs.extend(relativeTime);

interface NotificationDetailScreenProps {
  navigation: any;
  route: {
    params: {
      notification: {
        id: number;
        content: string;
        type: string;
        category: string;
        created_at: string;
        warning_level?: string; // Thêm warning level
        notifications?: {
          content: string;
          type: string;
          category: string;
          created_at: string;
          warning_level?: string; // Thêm warning level
        };
      };
    };
  };
}

const NotificationDetailScreen: React.FC<NotificationDetailScreenProps> = ({ navigation, route }) => {
  const { notification } = route.params;
  
  // Lấy thông tin notification (ưu tiên từ nested object)
  const notificationData = notification.notifications || notification;
  const content = notificationData.content || notification.content || 'Không có nội dung';
  const type = notificationData.type || notification.type || 'system';
  const category = notificationData.category || notification.category || 'GENERAL';
  const createdAt = notificationData.created_at || notification.created_at;
  const warningLevel = notificationData.warning_level || notification.warning_level;

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
        return <University size={20} color="#10B981" />;
      case 'FINANCE':
        return <CreditCard size={20} color="#F59E0B" />;
      case 'SYSTEM':
        return <AlertTriangle size={20} color="#EF4444" />;
      case 'GENERAL':
      default:
        return <Info size={20} color="#6B7280" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'ACADEMIC':
        return 'Học vụ';
      case 'FINANCE':
        return 'Tài chính';
      case 'SYSTEM':
        return 'Hệ thống';
      case 'GENERAL':
      default:
        return 'Chung';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'university':
        return 'Thông báo từ trường';
      case 'lecturer':
        return 'Thông báo từ giảng viên';
      case 'system':
      default:
        return 'Thông báo hệ thống';
    }
  };

  const formatDate = (dateString: string) => {
    const date = dayjs(dateString);
    const now = dayjs();
    const diffInMinutes = now.diff(date, 'minute');
    const diffInHours = now.diff(date, 'hour');
    const diffInDays = now.diff(date, 'day');

    if (diffInMinutes < 1) {
      return 'Vừa xong';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ngày trước`;
    } else {
      return date.format('DD/MM/YYYY HH:mm');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết thông báo</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notification Card */}
        <View style={styles.notificationCard}>
          {/* Header với icon và type */}
          <View style={styles.notificationHeader}>
            <View style={styles.iconContainer}>
              {getNotificationIcon(type)}
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.notificationType}>
                {getTypeLabel(type)}
              </Text>
            <View style={styles.timeContainer}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.notificationTime}>
                {getTimeAgo()}
              </Text>
            </View>
            </View>
          </View>

          {/* Category Badge */}
          <View style={styles.categoryContainer}>
            <View style={styles.categoryBadge}>
              {getCategoryIcon(category)}
              <Text style={styles.categoryText}>
                {getCategoryLabel(category)}
              </Text>
            </View>
            
            {/* Warning Level Badge */}
            {warningLevel && (
              <View style={[styles.categoryBadge, styles.warningBadge]}>
                <AlertTriangle size={16} color="#EF4444" />
                <Text style={[styles.categoryText, styles.warningText]}>
                  {translateWarningLevel(warningLevel)}
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Nội dung thông báo:</Text>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>
                {content}
              </Text>
            </View>
          </View>

          {/* Metadata */}
          <View style={styles.metadataContainer}>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>ID thông báo:</Text>
              <Text style={styles.metadataValue}>#{notification.id}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Loại:</Text>
              <Text style={styles.metadataValue}>{getTypeLabel(type)}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Danh mục:</Text>
              <Text style={styles.metadataValue}>{getCategoryLabel(category)}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Thời gian tạo:</Text>
              <Text style={styles.metadataValue}>
                {dayjs(createdAt).format('DD/MM/YYYY HH:mm:ss')}
              </Text>
            </View>
            {warningLevel && (
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Mức độ cảnh cáo:</Text>
                <Text style={[styles.metadataValue, styles.warningValue]}>
                  {translateWarningLevel(warningLevel)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Có thể thêm logic mark as read ở đây
              console.log('Mark as read');
            }}
          >
            <Text style={styles.actionButtonText}>Đánh dấu đã đọc</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              // Có thể thêm logic delete ở đây
              console.log('Delete notification');
              navigation.goBack();
            }}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Xóa thông báo
            </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  notificationType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 6,
  },
  warningBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  warningText: {
    color: '#DC2626',
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contentContainer: {
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  contentBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  metadataContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  warningValue: {
    color: '#DC2626',
    fontWeight: '700',
  },
  actionContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#FFFFFF',
  },
});

export default NotificationDetailScreen;
