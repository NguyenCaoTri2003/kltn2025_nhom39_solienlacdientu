import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import AppNavigator from "./src/screens/AppNavigator"; // 👈 thay cho HomeScreen
import { UserProvider } from "./src/context/UserContext";
import { NotificationProvider, useNotificationContext } from "./src/context/NotificationContext";
import { MessageProvider } from "./src/context/MessageProvider";
import ChatScreen from "./src/screens/ChatScreen";
import GlobalNotificationToast from "./src/components/GlobalNotificationToast";

const Stack = createNativeStackNavigator();

function GlobalToastWrapper() {
  const { toastVisible, toastNotification, hideToast } = useNotificationContext();

  return (
    <>
      <RootNavigator />
      <GlobalNotificationToast
        visible={toastVisible}
        notification={toastNotification}
        onClose={hideToast}
      />
    </>
  );
}

function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={AppNavigator} />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              gestureEnabled: true,
              presentation: "card",
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <NotificationProvider>
          <MessageProvider>
            <NavigationContainer>
              <GlobalToastWrapper />
            </NavigationContainer>
          </MessageProvider>
        </NotificationProvider>
      </UserProvider>
    </AuthProvider>
  );
}
