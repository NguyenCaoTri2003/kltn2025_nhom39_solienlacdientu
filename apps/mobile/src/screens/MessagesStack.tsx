import React, { useCallback } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFocusEffect, StackActions, useNavigation } from "@react-navigation/native";
import MessageListScreen from "./MessageListScreen";
import ChatScreen from "./ChatScreen";

const Stack = createNativeStackNavigator();

export default function MessagesStack() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const parentNav = navigation.getParent(); 
      if (!parentNav) return;

      const unsubscribe = parentNav.addListener("tabPress", (e: any) => {
        navigation.dispatch(StackActions.popToTop());
      });

      return unsubscribe;
    }, [navigation])
  );

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MessageList" component={MessageListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
    </Stack.Navigator>
  );
}