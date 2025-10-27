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
import { useNotifications } from '../../hooks/useNotifications';
import HeaderBar from '../../components/HeaderBar';
import NotificationToast from '../../components/NotificationToast';
import { useNavigation } from '@react-navigation/native';
import { useNotificationContext } from '../../context/NotificationContext';

/**
 * Màn hình thông báo chung cho tất cả user
 * Hiển thị danh sách thông báo với phân trang và realtime updates
 */
export default function NotificationScreen() {
  const navigation = useNavigation();
  const { resetUnreadCount, refreshUnreadCount } = useNotificationContext();
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
    markAsRead,
  } = useNotifications();



  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshUnreadCount();
      loadNotifications(true);
    });
    return unsubscribe;
  }, [navigation, refreshUnreadCount, loadNotifications]);


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
        { text: 'Xóa', style: 'destructive', onPress: () => deleteNotification(id) },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'university':
        return <University size={20} color="#005BAC" />;
      case 'lecturer':
        return <MessageSquare size={20} color="#005BAC" />;
      case 'system':
      default:
        return <Bell size={20} color="#005BAC" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
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
      return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} giờ trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    const isRead = item.is_read;
    const cardStyle = isRead ? styles.notificationCard : [styles.notificationCard, styles.unreadCard];
    const textStyle = isRead ? styles.notificationText : [styles.notificationText, styles.unreadText];
    
    return (
      <TouchableOpacity 
        style={cardStyle}
        onPress={() => (navigation as any).navigate('NotificationDetail', { 
          notification: item,
          onNotificationDeleted: () => loadNotifications(true)
        })}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationIconContainer}>
            {getNotificationIcon(item.type)}
          </View>
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeaderRow}>
              <Text style={styles.notificationType}>
                {getNotificationTypeLabel(item.type)}
              </Text>
              <Text style={styles.notificationTime}>
                {formatDate(item.created_at)}
              </Text>
              {!isRead && <View style={styles.unreadDot} />}
            </View>
            <Text style={textStyle} numberOfLines={2}>
              {item.title || item.content || 'Không có nội dung'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteNotification(item.id);
            }}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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
      <Text style={styles.errorTitle}>Không thể tải thông báo</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <Text style={styles.retryButtonText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#005BAC" />
        <Text style={styles.footerText}>Đang tải...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar title="Thông báo" />
      
      {error ? (
        renderError()
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={loading && notifications.length === 0}
              onRefresh={handleRefresh}
              colors={['#005BAC']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={!loading ? renderEmptyState : null}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Trạng thái kết nối*/}
      {/* <View style={styles.connectionStatus}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
        </Text>
      </View> */}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 4,
    borderLeftColor: '#005BAC',
  },
  notificationHeader: {
    flexDirection: 'row',
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
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#005BAC',
    textTransform: 'uppercase',
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  notificationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  unreadText: {
    fontWeight: '600',
    color: '#1F2937',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#005BAC',
    marginLeft: 8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
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
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#005BAC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
