// import React from "react";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import ProfileScreen from "../ProfileScreen";
// import ProfileScreenInfo from "./ProfileScreenInfo";
// import ChangePasswordScreen from "./ChangePasswordScreen";

// const Stack = createNativeStackNavigator();

// export default function ProfileStack() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="ProfileMain" component={ProfileScreen} />
//       <Stack.Screen 
//         name="ProfileInfo" 
//         component={ProfileScreenInfo}
        
//         options={{
//           headerShown: true,
//           title: "Thông tin cá nhân",
//           headerStyle: {
//             backgroundColor: "#005BAC",
//           },
//           headerTintColor: "#FFFFFF",
//           headerTitleStyle: {
//             fontWeight: "bold",
//             fontSize: 18,
//           },
//           headerTitleAlign: "center",
//         }}
//       />
//       <Stack.Screen
//         name="ChangePassword"
//         component={ChangePasswordScreen}
//         options={{
//           headerShown: true,
//           title: "Đổi mật khẩu",
//           headerStyle: {
//             backgroundColor: "#005BAC",
//           },
//           headerTintColor: "#FFFFFF",
//           headerTitleStyle: {
//             fontWeight: "bold",
//             fontSize: 18,
//           },
//           headerTitleAlign: "center",
//         }}
//       />
//     </Stack.Navigator>
//   );
// }

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "../ProfileScreen";
import ProfileScreenInfo from "./ProfileScreenInfo";
import ChangePasswordScreen from "./ChangePasswordScreen";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";

const Stack = createNativeStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />

      {/* ------- Profile Info ------- */}
      <Stack.Screen
        name="ProfileInfo"
        component={ProfileScreenInfo}
        options={({ navigation }) => ({
          headerShown: true,
          title: "Thông tin cá nhân",
          headerStyle: { backgroundColor: "#005BAC" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
          headerTitleAlign: "center",

          // Custom back button không chữ
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />

      {/* ------- Change Password ------- */}
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={({ navigation }) => ({
          headerShown: true,
          title: "Đổi mật khẩu",
          headerStyle: { backgroundColor: "#005BAC" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "bold", fontSize: 18 },
          headerTitleAlign: "center",

          // Custom back button không chữ
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ paddingHorizontal: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
}
