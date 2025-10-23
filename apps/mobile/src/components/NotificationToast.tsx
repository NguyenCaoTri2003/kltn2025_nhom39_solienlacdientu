import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Bell, X, AlertCircle, MessageSquare, University } from 'lucide-react-native';

interface NotificationToastProps {
  visible: boolean;
  notification: {
    id: number;
    content: string;
    type: 'university' | 'lecturer' | 'system' | null;
  } | null;
  onClose: () => void;
  onPress: () => void;
}

export default function NotificationToast({
  visible,
  notification,
  onClose,
  onPress,
}: NotificationToastProps) {
  const [animation] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, animation, translateY, onClose]);

  if (!visible || !notification) return null;

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

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animation,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toast}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {getNotificationIcon(notification.type)}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.typeLabel}>
              {getNotificationTypeLabel(notification.type)}
            </Text>
            <Text style={styles.message} numberOfLines={2}>
              {notification.content}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1E3A8A',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
