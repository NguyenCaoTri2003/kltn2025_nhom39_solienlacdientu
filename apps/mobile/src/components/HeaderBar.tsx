import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

type HeaderBarProps = {
  title: string;
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  backgroundColor?: string;
  style?: ViewStyle;
  unShowOnBack?: boolean; 
};

export default function HeaderBar({
  title,
  onBack,
  rightIcon,
  onRightPress,
  backgroundColor = "#1E3A8A",
  style,
  unShowOnBack,
}: HeaderBarProps) {
  const navigation = useNavigation();

  return (
    <View style={[styles.header, { backgroundColor }, style]}>
      {!unShowOnBack ? (
        <TouchableOpacity
          onPress={onBack || (() => navigation.goBack())}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {rightIcon ? (
        <TouchableOpacity onPress={onRightPress} style={styles.iconButton}>
          <Ionicons name={rightIcon} size={24} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconButton: {
    padding: 4,
  },
  iconPlaceholder: {
    width: 24,
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
