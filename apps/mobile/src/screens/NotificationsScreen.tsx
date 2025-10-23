import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, BellOff, Trash2, AlertCircle, MessageSquare, University } from 'lucide-react-native';
import { useNotifications } from '../hooks/useNotifications';
import HeaderBar from '../components/HeaderBar';
import NotificationToast from '../components/NotificationToast';
import { useNavigation } from '@react-navigation/native';
import { useNotificationContext } from '../context/NotificationContext';

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { resetUnreadCount } = useNotificationContext();
  const {
    notifications,
    loading,
    error,
    hasMore,
    isConnected,
    loadNotifications,
    deleteNotification,
    connectRealtime,
    disconnectRealtime,
  } = useNotifications();

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastNotification, setToastNotification] = useState<any>(null);

  useEffect(() => {
    connectRealtime();
  }, [connectRealtime]);


  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      setToastNotification(latestNotification);
      setToastVisible(true);
    }
  }, [notifications.length]);

  
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      resetUnreadCount();
    });
    return unsubscribe;
  }, [navigation, resetUnreadCount]);

  const handleRefresh = () => {
    loadNotifications(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadNotifications(false);
    }
  };

  const handleDeleteNotification = (id: number) => {
    Alert.alert(
      'Xóa thông báo',
      'Bạn có chắc chắn muốn xóa thông báo này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => deleteNotification(id),
        },
      ]
    );
  };

  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case 'university':
        return <University size={20} color="#1E3A8A" />;
      case 'lecturer':
        return <MessageSquare size={20} color="#059669" />;
      case 'system':
        return <AlertCircle size={20} color="#DC2626" />;
      default:
        return <Bell size={20} color="#6B7280" />;
    }
  };

  const getNotificationTypeLabel = (type: string | null) => {
    switch (type) {
      case 'university':
        return 'Trường học';
      case 'lecturer':
        return 'Giảng viên';
      case 'system':
        return 'Hệ thống';
      default:
        return 'Thông báo';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Vừa xong';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.notificationCard}
      onPress={() => navigation.navigate('NotificationDetail', { notification: item } as any)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIconContainer}>
          {getNotificationIcon(item.notifications?.type || item.type)}
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeaderRow}>
            <Text style={styles.notificationType}>
              {getNotificationTypeLabel(item.notifications?.type || item.type)}
            </Text>
            <Text style={styles.notificationTime}>
              {formatDate(item.notifications?.created_at || item.created_at)}
            </Text>
          </View>
          <Text style={styles.notificationText} numberOfLines={2}>
            {item.notifications?.content || item.content || 'Không có nội dung'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation(); // Ngăn navigate khi click delete
            handleDeleteNotification(item.id);
          }}
        >
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell size={48} color="#9CA3AF" />
      <Text style={styles.emptyStateTitle}>Chưa có thông báo</Text>
      <Text style={styles.emptyStateText}>
        Bạn sẽ nhận được thông báo khi có thông tin mới
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <AlertCircle size={48} color="#EF4444" />
      <Text style={styles.errorTitle}>Lỗi tải thông báo</Text>
      <Text style={styles.errorText}>{error}</Text>
      <Text style={styles.errorHint}>
        💡 Kiểm tra kết nối mạng và đảm bảo API server đang chạy
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <Text style={styles.retryButtonText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );

  const handleToastClose = () => {
    setToastVisible(false);
  };

  const handleToastPress = () => {
    setToastVisible(false);
    // Scroll to top to show latest notifications
    // You can add scroll functionality here if needed
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title="Thông báo" />
      
      {/* Notification Toast */}
      <NotificationToast
        visible={toastVisible}
        notification={toastNotification}
        onClose={handleToastClose}
        onPress={handleToastPress}
      />
      
      {/* Connection Status */}
      {/* <View style={styles.statusBar}>
        <View style={styles.statusRow}>
          {isConnected ? (
            <>
              <Bell size={16} color="#059669" />
              <Text style={styles.statusText}>Đã kết nối</Text>
            </>
          ) : (
            <>
              <BellOff size={16} color="#EF4444" />
              <Text style={styles.statusText}>Mất kết nối</Text>
            </>
          )}
        </View>
        <TouchableOpacity
          style={styles.reconnectButton}
          onPress={isConnected ? disconnectRealtime : connectRealtime}
        >
          <Text style={styles.reconnectButtonText}>
            {isConnected ? 'Ngắt kết nối' : 'Kết nối lại'}
          </Text>
        </TouchableOpacity>
      </View> */}

      {/* Danh sách Notifications */}
      {error ? (
        renderError()
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotification}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loading && notifications.length > 0 ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color="#1E3A8A" />
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  reconnectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E3A8A',
    borderRadius: 6,
  },
  reconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
    textTransform: 'uppercase',
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
