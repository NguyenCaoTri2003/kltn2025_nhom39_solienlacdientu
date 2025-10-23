import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NotificationsScreen from './NotificationsScreen';
import NotificationDetailScreen from './NotificationDetailScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotificationsList" component={NotificationsScreen} />
      <Stack.Screen 
        name="NotificationDetail" 
        component={NotificationDetailScreen}
        options={{ 
          title: "Chi tiết thông báo",
          headerShown: true,
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: '#111827',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Stack.Navigator>
  );
}
