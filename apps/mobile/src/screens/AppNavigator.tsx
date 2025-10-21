import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import StudentHomeScreen from "./student/StudentHomeScreen";
import ParentHomeScreen from "./parent/ParentHomeScreen";
import ProfileScreen from "./ProfileScreen";
import AttendanceScreen from "./AttendanceScreen";
import ScheduleScreen from "./ScheduleScreen";
import MessagesScreen from "./MessagesScreen";
import AppointmentsScreen from "./AppointmentsScreen";
import CourseOfferingScreen from "./CourseOfferingScreen";
import { useAuth } from "../context/AuthContext";
import CourseOfferingDetailScreen from "./CourseOfferingDetailScreen";
import { RootStackParamList } from "../types/navigation";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function StudentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
      <Stack.Screen name="CourseOffering" component={CourseOfferingScreen} />
      <Stack.Screen
        name="CourseOfferingDetail"
        component={CourseOfferingDetailScreen}
        options={{ title: "Chi tiết học phần" }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#005BAC",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: { backgroundColor: "white", borderTopColor: "#ddd" },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "Schedule":
              iconName = "calendar";
              break;
            case "Attendance":
              iconName = "checkmark-circle";
              break;
            case "Messages":
              iconName = "chatbubbles";
              break;
            case "Appointments":
              iconName = "alarm";
              break;
            case "Profile":
              iconName = "person";
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={isStudent ? StudentStack : ParentHomeScreen}
        options={{ title: "Trang chủ" }}
      />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ title: "Lịch học" }} />
      <Tab.Screen name="Attendance" component={AttendanceScreen} options={{ title: "Điểm danh" }} />
      <Tab.Screen name="Messages" component={MessagesScreen} options={{ title: "Nhắn tin" }} />
      {!isStudent && (
        <Tab.Screen
          name="Appointments"
          component={AppointmentsScreen}
          options={{ title: "Lịch hẹn" }}
        />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Cá nhân" }} />
    </Tab.Navigator>
  );
}
