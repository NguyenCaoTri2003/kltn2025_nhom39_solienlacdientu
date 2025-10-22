import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import AppNavigator from "./src/screens/AppNavigator"; // 👈 thay cho HomeScreen
import { UserProvider } from "./src/context/UserContext";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // 👇 Nếu đã đăng nhập, vào app chính (có navbar)
        <Stack.Screen name="Main" component={AppNavigator} />
      ) : (
        // 👇 Nếu chưa đăng nhập, vào màn hình Login
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </UserProvider>
    </AuthProvider>
  );
}
