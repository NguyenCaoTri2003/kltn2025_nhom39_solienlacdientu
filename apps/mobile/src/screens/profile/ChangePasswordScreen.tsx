import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../constants/config";
import { getAuthToken } from "../../utils/auth";
import { isValidPassword } from "@packages/utils/Regex";

export default function ChangePasswordScreen() {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [currentPasswordError, setCurrentPasswordError] = useState<string>("");
  const [serverError, setServerError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmMismatch = passwordData.confirmPassword.length > 0 && passwordData.newPassword !== passwordData.confirmPassword;
  const weakNewPassword = passwordData.newPassword.length > 0 && !isValidPassword(passwordData.newPassword);
  const sameAsCurrent = passwordData.newPassword.length > 0 && passwordData.currentPassword.length > 0 && passwordData.newPassword === passwordData.currentPassword;
  const allFilled = !!passwordData.currentPassword && !!passwordData.newPassword && !!passwordData.confirmPassword;
  const isFormValid = allFilled && !confirmMismatch && !weakNewPassword && !sameAsCurrent;

  const handleChangePassword = async () => {
    if (!isFormValid) return;
    setCurrentPasswordError("");
    setServerError("");
    setIsSubmitting(true);

    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data?.error === "Current password is incorrect") {
          setCurrentPasswordError("Mật khẩu hiện tại không đúng.");
        } else {
          setServerError(data?.error || "Đổi mật khẩu thất bại");
        }
        return;
      }

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      Alert.alert("Thành công", "Đổi mật khẩu thành công!", [
        { text: "OK", onPress: () => {} }
      ]);
    } catch (e) {
      Alert.alert("Lỗi", (e as Error)?.message || "Đổi mật khẩu thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrengthText = () => {
    if (passwordData.newPassword.length === 0) return "";
    if (weakNewPassword) {
      return "Mật khẩu phải có từ 8 đến 50 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt";
    }
    return ""; 
  };

  const getPasswordStrengthColor = () => {
    if (passwordData.newPassword.length === 0) return "#6B7280";
    if (weakNewPassword) return "#EF4444";
    return "#10B981";
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} >
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>
            Để bảo mật tài khoản, vui lòng đổi mật khẩu định kỳ
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu hiện tại</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu hiện tại"
                secureTextEntry={!showCurrentPassword}
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                <MaterialIcons 
                  name={showCurrentPassword ? "visibility-off" : "visibility"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>
            {currentPasswordError ? (
              <Text style={styles.errorText}>{currentPasswordError}</Text>
            ) : null}
          </View>


          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu mới</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu mới"
                maxLength={50}
                secureTextEntry={!showNewPassword}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <MaterialIcons 
                  name={showNewPassword ? "visibility-off" : "visibility"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>
            {passwordData.newPassword.length > 0 && getPasswordStrengthText() && (
              <Text style={[styles.helpText, { color: getPasswordStrengthColor() }]}>
                {getPasswordStrengthText()}
              </Text>
            )}
          </View>


          <View style={styles.inputGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu mới"
                secureTextEntry={!showConfirmPassword}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <MaterialIcons 
                  name={showConfirmPassword ? "visibility-off" : "visibility"} 
                  size={20} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>
            {(confirmMismatch || sameAsCurrent) && (
              <Text style={styles.errorText}>
                {confirmMismatch ? "Mật khẩu xác nhận không khớp" : "Mật khẩu mới phải khác mật khẩu hiện tại"}
              </Text>
            )}
          </View>


          {serverError ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error" size={20} color="#EF4444" />
              <Text style={styles.errorText}>{serverError}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
            onPress={handleChangePassword}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Đổi mật khẩu</Text>
            )}
          </TouchableOpacity>
        </View>

      
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#005BAC",
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#B3D9FF",
    textAlign: "center",
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    marginTop: 4,
  },
  helpText: {
    fontSize: 14,
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#005BAC",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  requirementsCard: {
    backgroundColor: "#FFFFFF",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  requirementsList: {
    gap: 4,
  },
  requirementItem: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
});
