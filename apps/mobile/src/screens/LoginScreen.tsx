import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import AppBackground from "../components/AppBackground";

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "parent">("student");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password)
      return Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");

    try {
      setLoading(true);
      await login(identifier, password, role);
      navigation.replace("Main");
    } catch (err: any) {
      Alert.alert("Đăng nhập thất bại", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppBackground>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.container}>
          {/* Logo IUH */}
          <Image
            source={require("../../assets/logo-iuh.png")} 
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.appName}>SỔ LIÊN LẠC ĐIỆN TỬ</Text>
          <Text style={styles.subText}>Trường Đại học Công nghiệp TP.HCM</Text>

          {/* Ô nhập thông tin */}
          <View style={styles.form}>
            <TextInput
              placeholder="Tài khoản"
              value={identifier}
              onChangeText={setIdentifier}
              style={styles.input}
              placeholderTextColor="#6b7280"
            />

            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput]}
                placeholderTextColor="#6b7280"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeButton}
                accessibilityLabel={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>

            {/* Vai trò */}
            <View style={styles.roleContainer}>
              {["student", "parent"].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRole(r as any)}
                  style={[
                    styles.roleButton,
                    role === r && styles.roleButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      role === r && styles.roleTextActive,
                    ]}
                  >
                    {r === "student" ? "Học sinh" : "Phụ huynh"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Nút đăng nhập */}
            <TouchableOpacity
              onPress={handleLogin}
              style={styles.loginButton}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>
          </View>
          </View>
        </ScrollView>
      </AppBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 30,
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#005BAC",
    textAlign: "center",
  },
  subText: {
    fontSize: 16,
    color: "#1E3A8A",
    marginBottom: 30,
    textAlign: "center",
  },
  form: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  input: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    color: "#111827",
    width: "100%",
  },
  passwordContainer: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 44, 
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -20 }], 
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 12,
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  roleButtonActive: {
    backgroundColor: "#005BAC",
  },
  roleText: {
    color: "#111827",
    fontWeight: "500",
  },
  roleTextActive: {
    color: "white",
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#005BAC",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  loginText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
});
