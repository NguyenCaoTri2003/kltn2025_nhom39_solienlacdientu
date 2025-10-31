import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"; 
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
import {translateAcademicStatus, translateTrainingType, translateTrainingLevel, translateRelationship} from "@packages/utils/translations";

interface UserProfileInfo {
  id: string;
  role: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  ethnic: string;
  status: string;
  citizen_id_card: string;
  avatar_url: string;
  created_at: string;
  last_login: string;
  faculty_name?: string;
  academic_rank?: string;
}

export default function ProfileScreenInfo() {
  const { user, token } = useAuth();
  const { userData, loading: userLoading, refreshUser } = useUser();
  const [profile, setProfile] = useState<UserProfileInfo | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const API_BASE = process.env.EXPO_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${API_BASE}/api/users/detail/${user.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (res.ok) {
        setDetail(data);
        const mapped: UserProfileInfo = {
          id: String(data.id ?? user.id),
          role: data.role || user.role || "",
          full_name: data.full_name || user.full_name || "",
          email: data.email || user.email || "",
          phone: data.phone || user.phone || "",
          address: data.address || user.address || "",
          ethnic: data.ethnic || "",
          status: data.status || user.status || "",
          citizen_id_card: data.citizen_id_card || "",
          avatar_url: data.avatar_url || user.avatar_url || "",
          created_at: data.created_at || "",
          last_login: data.last_login || "",
          faculty_name: data.lecturer?.faculties?.name || data.faculty_name || "",
          academic_rank: data.lecturer?.academic_rank || data.academic_rank || "",
        };
        setProfile(mapped);
      } else {
        // fallback to existing minimal info
        const mapped: UserProfileInfo = {
          id: String(user.id),
          role: user.role || "",
          full_name: user.full_name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          ethnic: "",
          status: user.status || "",
          citizen_id_card: "",
          avatar_url: user.avatar_url || "",
          created_at: "",
          last_login: "",
        };
        setProfile(mapped);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "student":
        return "Sinh viên";
      case "parent":
        return "Phụ huynh";
      default:
        return role;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "inactive":
        return "Không hoạt động";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Chưa có";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN");
  };

  const formatBirthDate = (dateString: string) => {
    if (!dateString) return "Chưa có";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#005BAC" />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Không thể tải thông tin</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}>
        {/* Header với Avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {(() => {
                    const parts = (profile.full_name || "").trim().split(" ");
                    return parts[parts.length - 1]?.[0]?.toUpperCase() || "?";
                  })()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.userName}>{profile.full_name || "Chưa có tên"}</Text>
          <Text style={styles.userRole}>{getRoleLabel(profile.role)}</Text>
        </View>

        {/* Thông tin cá nhân */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={20} color="#005BAC" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Họ và tên</Text>
                <Text style={styles.infoValue}>{profile.full_name || "Chưa có"}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={20} color="#005BAC" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile.email || "Chưa có"}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={20} color="#005BAC" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{profile.phone || "Chưa có"}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color="#005BAC" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoValue}>{profile.address || "Chưa có"}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="people" size={20} color="#005BAC" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Dân tộc</Text>
                <Text style={styles.infoValue}>{profile.ethnic || "Chưa có"}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialIcons name="badge" size={20} color="#005BAC" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>CMND/CCCD</Text>
                <Text style={styles.infoValue}>{profile.citizen_id_card || "Chưa có"}</Text>
              </View>
            </View>

            {/* Ngày sinh (đưa lên phần thông tin cá nhân khi là sinh viên) */}
            {profile.role === 'student' && detail?.student?.date_of_birth && (
              <View style={styles.infoRow}>
                <MaterialIcons name="date-range" size={20} color="#005BAC" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Ngày sinh</Text>
                  <Text style={styles.infoValue}>{formatBirthDate(detail.student.date_of_birth || "")}</Text>
                </View>
              </View>
            )}

            {/* Nghề nghiệp - chỉ hiển thị cho phụ huynh */}
            {profile.role === 'parent' && (detail?.parent?.occupation || userData?.parent?.occupation) && (
              <View style={styles.infoRow}>
                <MaterialIcons name="work" size={20} color="#005BAC" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nghề nghiệp</Text>
                  <Text style={styles.infoValue}>{detail?.parent?.occupation || userData?.parent?.occupation}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Thông tin bổ sung cho sinh viên */}
        {profile.role === 'student' && detail?.student && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin học tập</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialIcons name="school" size={20} color="#005BAC" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Mã sinh viên</Text>
                  <Text style={styles.infoValue}>{detail.student?.student_code || "Chưa có"}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="class" size={20} color="#005BAC" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Trạng thái học tập</Text>
                  <Text style={styles.infoValue}>{translateAcademicStatus(detail.student?.academic_status) || "Chưa có"}</Text>
                </View>
              </View>


              <View style={styles.infoRow}>
                <MaterialIcons name="location-city" size={20} color="#005BAC" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nơi sinh</Text>
                  <Text style={styles.infoValue}>{detail.student?.place_of_birth || "Chưa có"}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="home" size={20} color="#005BAC" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Địa chỉ liên hệ</Text>
                  <Text style={styles.infoValue}>{detail.student?.contact_address || "Chưa có"}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="school" size={20} color="#005BAC" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Loại đào tạo</Text>
                  <Text style={styles.infoValue}>{translateTrainingType(detail.student?.type_of_tranning) || "Chưa có"}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="trending-up" size={20} color="#005BAC" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Trình độ đào tạo</Text>
                  <Text style={styles.infoValue}>{translateTrainingLevel(detail.student?.training_level) || "Chưa có"}</Text>
                </View>
              </View>

              

              <View style={styles.infoRow}>
                <MaterialIcons name="calendar-today" size={20} color="#005BAC" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Năm học</Text>
                  <Text style={styles.infoValue}>{detail.student?.academic_year || "Chưa có"}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="apartment" size={20} color="#005BAC" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Khoa</Text>
                  <Text style={styles.infoValue}>{
                    detail.student?.classes?.majors?.faculties?.name ||
                    detail.student?.class?.majors?.faculties?.name ||
                    "Chưa có"
                  }</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons name="class" size={20} color="#005BAC" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Lớp</Text>
                  <Text style={styles.infoValue}>{
                    detail.student?.classes?.name ||
                    detail.student?.class?.name ||
                    detail.student?.classes?.class_code ||
                    "Chưa có"
                  }</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quan hệ gia đình (Phụ huynh của sinh viên) */}
        {profile.role === 'student' && Array.isArray(detail?.parents) && detail.parents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quan hệ gia đình</Text>
            {detail.parents.map((p: any, idx: number) => (
              <View key={idx} style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="person" size={20} color="#005BAC" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{p.relationship === 'father' ? 'Họ tên cha' : p.relationship === 'mother' ? 'Họ tên mẹ' : p.relationship === 'guardian' ? 'Họ tên người giám hộ' : 'Họ tên'}</Text>
                    <Text style={styles.infoValue}>{p.user?.full_name || 'Chưa có'}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="work" size={20} color="#005BAC" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Nghề nghiệp</Text>
                    <Text style={styles.infoValue}>{p.occupation || 'Chưa có'}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="phone" size={20} color="#005BAC" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Số điện thoại</Text>
                    <Text style={styles.infoValue}>{p.user?.phone || 'Chưa có'}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="email" size={20} color="#005BAC" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{p.user?.email || 'Chưa có'}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="badge" size={20} color="#005BAC" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>CMND/CCCD</Text>
                    <Text style={styles.infoValue}>{p.user?.citizen_id_card || 'Chưa có'}</Text>
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="location-on" size={20} color="#005BAC" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Địa chỉ</Text>
                    <Text style={styles.infoValue}>{p.user?.address || 'Chưa có'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}


        {/* Thông tin con cho phụ huynh */}
        {profile.role === 'parent' && detail?.children && detail.children.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin con</Text>
            
            {detail.children.map((child: any, index: number) => (
              <View key={child.id || index} style={styles.infoCard}>
                <View style={styles.childHeader}>
                  <MaterialIcons name="person" size={24} color="#005BAC" />
                  <Text style={styles.childName}>{child.user?.full_name || child.users?.full_name || "Chưa có tên"}</Text>
                </View>
                
                {/* Liên hệ của con (nếu có) */}
                {(child.user?.email || child.user?.phone) && (
                  <>
                    {child.user?.email && (
                      <View style={styles.infoRow}>
                        <MaterialIcons name="email" size={20} color="#005BAC" />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Email</Text>
                          <Text style={styles.infoValue}>{child.user.email}</Text>
                        </View>
                      </View>
                    )}
                    {child.user?.phone && (
                      <View style={styles.infoRow}>
                        <MaterialIcons name="phone" size={20} color="#005BAC" />
                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Số điện thoại</Text>
                          <Text style={styles.infoValue}>{child.user.phone}</Text>
                        </View>
                      </View>
                    )}
                  </>
                )}

                {/* Thông tin cơ bản - tên, lớp, năm học */}
                <View style={styles.infoRow}>
                  <MaterialIcons name="school" size={20} color="#005BAC" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Mã sinh viên</Text>
                    <Text style={styles.infoValue}>{child.student?.student_code || child.student_code || "Chưa có"}</Text>
                  </View>
                </View>

                {(child.class || child.classes) && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="class" size={20} color="#005BAC" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Lớp</Text>
                      <Text style={styles.infoValue}>{child.class?.name || child.classes?.name || child.classes?.class_code || "Chưa có"}</Text>
                    </View>
                  </View>
                )}

                {(child.class?.majors?.faculties?.name || child.classes?.majors?.faculties?.name) && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="apartment" size={20} color="#005BAC" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Khoa</Text>
                      <Text style={styles.infoValue}>{child.class?.majors?.faculties?.name || child.classes?.majors?.faculties?.name || "Chưa có"}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <MaterialIcons name="calendar-today" size={20} color="#005BAC" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Năm học</Text>
                    <Text style={styles.infoValue}>{child.academic_year || "Chưa có"}</Text>
                  </View>
                </View>

                {/* Thông tin mối quan hệ */}
                {child.relationship && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="family-restroom" size={20} color="#005BAC" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Mối quan hệ</Text>
                      <Text style={styles.infoValue}>{translateRelationship(child.relationship)}</Text>
                    </View>
                  </View>
                )}

                {child.student?.academic_status || child.academic_status ? (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="insights" size={20} color="#005BAC" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Trạng thái học tập</Text>
                      <Text style={styles.infoValue}>{translateAcademicStatus(child.student?.academic_status || child.academic_status)}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
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
   // paddingTop: 20,
    flex: 1,
  },
  header: {
    backgroundColor: "#005BAC",
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 0,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#005BAC",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: "#B3D9FF",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#005BAC",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F0F0F0",
  },
  infoContent: {
    flex: 1,
    marginLeft: 18,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#EF4444",
  },
  childHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  childName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#005BAC",
    marginLeft: 8,
  },
});
