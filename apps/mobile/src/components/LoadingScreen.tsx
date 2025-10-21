import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Animated,
  ActivityIndicator,
  StyleSheet,
  Easing,
} from "react-native";

export default function LoadingScreen({ text = "Đang tải dữ liệu..." }) {
  const fadeAnim = useRef(new Animated.Value(0.5)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hiệu ứng fade in/out nhẹ để nhìn mượt
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Xoay tròn icon loading
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ rotate: spin }] }}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </Animated.View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#1E3A8A",
    fontWeight: "500",
  },
});
