// src/screens/MessagesStack.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MessageListScreen from "./MessageListScreen";
import ChatScreen from "./ChatScreen";

const Stack = createNativeStackNavigator();

export default function MessagesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MessageList"
        component={MessageListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
        // options={({ route }) => ({
        //   title: route.params?.receiverName || "Trò chuyện",
        //   headerBackTitleVisible: false,
        // })}
      />
    </Stack.Navigator>
  );
}
