"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import NavbarClient from "@/components/navbar-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Save,
  ArrowLeft,
  Edit3,
  X,
  AlertCircle,
  GraduationCap,
  Users,
} from "lucide-react";

import {
  isValidEmail,
  isValidPhone,
  isValidFullName,
  isValidCitizenId,
  isValidAddress,
  isValidEthnic,
} from "@packages/utils/Regex";
import { getAvatarColor } from "@/utils/color-hash";

import {
  translateRole,
  translateAcademicRank,
  translateAcademicStatus,
  translateTrainingType,
  translateTrainingLevel,
  translateRelationship,
} from "@packages/utils/translations";

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
  student?: {
    student_code?: string;
    academic_status?: string;
    date_of_birth?: string | null;
    place_of_birth?: string | null;
    contact_address?: string | null;
    type_of_tranning?: string | null;
    training_level?: string | null;
    academic_year?: string | null;
  };
  children?: Array<{
    id: number;
    student_code?: string;
    academic_year?: string | null;
    classes?: { class_code?: string | null } | null;
    users?: { full_name?: string | null } | null;
    relationship?: string | null;
  }>;
}

type LoggedInUser = {
  id: number;
  role: string;
  full_name?: string;
  name?: string;
  avatar_url?: string | null;
};

export default function PersonalProfile() {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [profile, setProfile] = useState<UserProfileInfo>({
    id: "",
    role: "",
    full_name: "",
    email: "",
    phone: "",
    address: "",
    ethnic: "",
    status: "",
    citizen_id_card: "",
    avatar_url: "",
    created_at: "",
    last_login: "",
  });
  const [originalProfile, setOriginalProfile] =
    useState<UserProfileInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<
    Partial<
      Record<
        keyof Pick<
          UserProfileInfo,
          | "full_name"
          | "email"
          | "phone"
          | "address"
          | "ethnic"
          | "citizen_id_card"
        >,
        string
      >
    >
  >({});
  const router = useRouter();

  const displayName =
    originalProfile?.full_name || user?.full_name || user?.name || "?";

  const userId = user?.id ?? null;
  const initial = useMemo(() => {
    const parts = displayName.trim().split(" ");
    return parts[parts.length - 1]?.[0]?.toUpperCase() ?? "?";
  }, [displayName]);

  const bgColor = useMemo(
    () =>
      getAvatarColor(
        userId !== null && userId !== undefined ? String(userId) : displayName
      ),
    [userId, displayName]
  );

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
      return;
    }

    const cookieUserRaw = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user="))
      ?.split("=")[1];

    if (cookieUserRaw) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookieUserRaw));
        setUser(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const token =
          document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            ?.split("=")[1] || localStorage.getItem("token");

        const apiBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiBase}/api/users/${user.id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });

        if (!res.ok) return;
        const u = await res.json();

        const mapped: UserProfileInfo = {
          id: String(
            user.role === "lecturer"
              ? u.lecturer?.lecturer_code ?? u.lecturer_code ?? ""
              : u.id
          ),
          role: u.role ?? "",
          full_name: u.full_name ?? "",
          email: u.email ?? "",
          phone: u.phone ?? "",
          address: u.address ?? "",
          ethnic: u.ethnic ?? "",
          status: u.status ?? "",
          citizen_id_card: u.citizen_id_card ?? "",
          avatar_url: u.avatar_url ?? "",
          created_at: u.created_at ?? "",
          last_login: u.last_login ?? "",
          student:
            u.role === "student"
              ? {
                  student_code: u.student?.student_code ?? "",
                  academic_status: u.student?.academic_status ?? "",
                  date_of_birth: u.student?.date_of_birth ?? null,
                  place_of_birth: u.student?.place_of_birth ?? null,
                  contact_address: u.student?.contact_address ?? null,
                  type_of_tranning:
                    u.student?.type_of_tranning ??
                    (u.student?.type_of_training ?? null),
                  training_level: u.student?.training_level ?? null,
                  academic_year: u.student?.academic_year ?? null,
                }
              : undefined,
          children: u.role === "parent" ? (u.children ?? []) : undefined,
        };

        if (u.role === "lecturer" && u.lecturer?.faculty_id) {
          try {
            const facultyRes = await fetch(
              `${apiBase}/api/faculties/${u.lecturer.faculty_id}`,
              {
                headers: {
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                cache: "no-store",
              }
            );
            if (facultyRes.ok) {
              const facultyData = await facultyRes.json();
              mapped.faculty_name = facultyData?.data?.name ?? "";
              mapped.academic_rank = u.lecturer?.academic_rank ?? "";
            }
          } catch {
            console.warn("Không thể tải thông tin khoa");
          }
        }

        setProfile(mapped);
        setOriginalProfile(mapped);
      } catch {
        // ignore
      }
    };

    fetchProfile();
  }, [user]);

  const validateField = (
    field: keyof UserProfileInfo,
    value: string
  ): string | undefined => {
    switch (field) {
      case "full_name":
        if (!value.trim()) return "Họ và tên là bắt buộc";
        if (!isValidFullName(value)) return "Họ và tên không hợp lệ";
        return undefined;
      case "email":
        if (!value.trim()) return "Email là bắt buộc";
        if (!isValidEmail(value)) return "Email không hợp lệ";
        return undefined;
      case "phone":
        if (!value.trim()) return "Số điện thoại là bắt buộc";
        if (!isValidPhone(value)) return "Số điện thoại không hợp lệ";
        return undefined;
      case "address":
        if (!value.trim()) return undefined;
        if (!isValidAddress(value)) return "Địa chỉ không hợp lệ";
        return undefined;
      case "ethnic":
        if (!value.trim()) return undefined;
        if (!isValidEthnic(value)) return "Dân tộc không hợp lệ";
        return undefined;
      case "citizen_id_card":
        if (!value.trim()) return undefined;
        if (!isValidCitizenId(value)) return "CCCD không hợp lệ";
        return undefined;
      default:
        return undefined;
    }
  };

  const validateAll = (data: UserProfileInfo) => {
    const nextErrors: typeof errors = {};
    nextErrors.full_name = validateField("full_name", data.full_name);
    nextErrors.email = validateField("email", data.email);
    nextErrors.phone = validateField("phone", data.phone);
    nextErrors.address = validateField("address", data.address);
    nextErrors.ethnic = validateField("ethnic", data.ethnic);
    nextErrors.citizen_id_card = validateField(
      "citizen_id_card",
      data.citizen_id_card
    );
    const compact = Object.fromEntries(
      Object.entries(nextErrors).filter(([, v]) => v)
    ) as typeof errors;
    setErrors(compact);
    return compact;
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      const currentErrors = validateAll(profile);
      if (Object.keys(currentErrors).length > 0) {
        alert("Vui lòng kiểm tra lại các trường không hợp lệ");
        return;
      }
      const token =
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1] || localStorage.getItem("token");

      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      const fields: (keyof UserProfileInfo)[] = [
        "email",
        "phone",
        "address",
        "ethnic",
        "status",
        "citizen_id_card",
        "avatar_url",
      ];

      const userDiff: Record<string, string> = {};
      for (const key of fields) {
        const curr = profile[key] ?? "";
        const prev = originalProfile ? originalProfile[key] ?? "" : undefined;
        if (prev === undefined || curr !== prev) {
          userDiff[key] = curr as string;
        }
      }

      if (Object.keys(userDiff).length === 0) {
        setIsEditing(false);
        return;
      }

      const res = await fetch(`${apiBase}/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ user: userDiff }),
      });

      if (!res.ok) {
        let serverMessage = "Cập nhật thất bại";
        try {
          const text = await res.text();
          serverMessage = (() => {
            try {
              const j = JSON.parse(text);
              return j.error || j.message || text || serverMessage;
            } catch {
              return text || serverMessage;
            }
          })();
        } catch {}
        throw new Error(serverMessage);
      }

      const updated = await res.json();

      setProfile(updated);
      setOriginalProfile(updated);
      setIsEditing(false);

      alert("✅ Cập nhật thành công!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Cập nhật thất bại";
      console.error(err);
      alert("❌ " + message);
    }
  };

  const handleCancelEdit = () => {
    if (originalProfile) {
      setProfile(originalProfile);
      setErrors({});
    }
    setIsEditing(false);
  };

  if (!user) return null;

  const hasError = Object.values(errors).some((err) => err);
  const isChanged =
    JSON.stringify(profile) !== JSON.stringify(originalProfile);
  const disabled = hasError || !originalProfile || !isChanged;

  return (
    <div className="min-h-screen bg-background">
      {user && (
        <NavbarClient
          userRole={
            user?.role === "admin"
              ? "admin"
              : user?.role === "lecturer"
              ? "lecturer"
              : user?.role === "student"
              ? "student"
              : user?.role === "parent"
              ? "parent"
              : null
          }
          userName={user?.full_name || ""}
        />
      )}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="group inline-flex items-center gap-2 text-sm font-500 text-gray-600 hover:text-indigo-600 transition-all mb-5"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Quay lại</span>
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
              Thông tin cá nhân
            </h1>
            <p className="text-sm text-gray-500 font-400">
              Quản lý và cập nhật hồ sơ cá nhân của bạn
            </p>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="mb-6">
          <Card className="bg-card border border-border overflow-hidden">
            <div className="px-5 py-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 ring-2 ring-border">
                    {profile.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} />
                    ) : null}
                    <AvatarFallback
                      className={`text-2xl font-bold ${bgColor} text-white`}
                    >
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-0.5 truncate max-w-[16rem]"
                      title={displayName}>
                      {displayName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                      <span className="text-xs px-2 py-0.5 rounded-full border border-border">
                        {translateRole(profile.role)}
                      </span>
                      {profile.role === "lecturer" && (
                        <>
                          {profile.academic_rank && (
                            <>
                              <span className="opacity-60">•</span>
                              <span className="text-xs">
                                {translateAcademicRank(profile.academic_rank)}
                              </span>
                            </>
                          )}
                          {profile.faculty_name && (
                            <>
                              <span className="opacity-60">•</span>
                              <span className="text-xs">
                                Khoa {profile.faculty_name}
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    if (isEditing) {
                      handleCancelEdit();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className={`gap-2 px-4 py-2 rounded-md text-sm transition-colors border ${
                    isEditing
                      ? "bg-destructive text-destructive-foreground hover:opacity-90 border-transparent"
                      : "bg-card text-primary hover:bg-accent border-border"
                  }`}
                >
                  {isEditing ? (
                    <>
                      <X className="w-4 h-4" />
                      Hủy chỉnh sửa
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4" />
                      Chỉnh sửa thông tin
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-card border border-border">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-lg font-semibold text-foreground">
              Thông tin cơ bản
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs mt-1">
              {isEditing
                ? "Chỉnh sửa các thông tin bên dưới"
                : "Xem thông tin chi tiết của bạn"}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ID Field */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Mã {user?.role === "lecturer" ? "giảng viên" : "người dùng"}
                </Label>
                {isEditing ? (
                  <Input
                    value={profile.id}
                    disabled
                    className="bg-muted border border-border text-foreground rounded px-3 py-2 cursor-not-allowed"
                  />
                ) : (
                  <div className="text-sm text-foreground px-3 py-2 bg-muted rounded">
                    {profile.id}
                  </div>
                )}
              </div>

              {/* Full Name Field */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Họ và tên
                </Label>
                {isEditing ? (
                  <Input
                    maxLength={128}
                    disabled
                    className="bg-muted border border-border text-foreground rounded px-3 py-2 cursor-not-allowed"
                    value={profile.full_name ?? ""}
                    readOnly
                  />
                ) : (
                  <div className="text-sm text-foreground px-3 py-2 bg-muted rounded">
                    {profile.full_name ?? ""}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Email
                </Label>
                {isEditing ? (
                  <Input
                    type="email"
                    maxLength={100}
                    value={profile.email ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProfile({ ...profile, email: v });
                      setErrors((prev) => ({
                        ...prev,
                        email: validateField("email", v),
                      }));
                    }}
                    className="rounded px-3 py-2 text-sm border border-border focus:border-primary focus:ring-0"
                  />
                ) : (
                  <Input
                    type="text"
                    value={profile.email ?? ""}
                    disabled
                    className="bg-muted border border-border text-foreground rounded px-3 py-2 cursor-not-allowed"
                  />
                )}
                {errors.email && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </div>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Số điện thoại
                </Label>
                {isEditing ? (
                  <Input
                    maxLength={10}
                    value={profile.phone ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProfile({ ...profile, phone: v });
                      setErrors((prev) => ({
                        ...prev,
                        phone: validateField("phone", v),
                      }));
                    }}
                    className="rounded px-3 py-2 text-sm border border-border focus:border-primary focus:ring-0"
                  />
                ) : (
                  <Input
                    type="text"
                    value={profile.phone ?? ""}
                    disabled
                    className="bg-muted border border-border text-foreground rounded px-3 py-2 cursor-not-allowed"
                  />
                )}
                {errors.phone && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </div>
                )}
              </div>

              {/* Address Field */}
              <div className="space-y-2 md:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Địa chỉ
                </Label>
                {isEditing ? (
                  <Input
                    maxLength={255}
                    value={profile.address ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProfile({ ...profile, address: v });
                      setErrors((prev) => ({
                        ...prev,
                        address: validateField("address", v),
                      }));
                    }}
                    className="rounded px-3 py-2 text-sm border border-border focus:border-primary focus:ring-0"
                  />
                ) : (
                  <Input
                    type="text"
                    value={profile.address ?? ""}
                    disabled
                    className="bg-muted border border-border text-foreground rounded px-3 py-2 cursor-not-allowed"
                  />
                )}
                {errors.address && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.address}
                  </div>
                )}
              </div>

              {/* Ethnic Field */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Dân tộc
                </Label>
                {isEditing ? (
                  <Input
                    maxLength={20}
                    value={profile.ethnic ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProfile({ ...profile, ethnic: v });
                      setErrors((prev) => ({
                        ...prev,
                        ethnic: validateField("ethnic", v),
                      }));
                    }}
                    className="rounded px-3 py-2 text-sm border border-border focus:border-primary focus:ring-0"
                  />
                ) : (
                  <div className="text-sm text-foreground px-3 py-2 bg-muted rounded">
                    {profile.ethnic ?? ""}
                  </div>
                )}
                {errors.ethnic && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.ethnic}
                  </div>
                )}
              </div>

              {/* CCCD Field */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  CCCD
                </Label>
                {isEditing ? (
                  <Input
                    maxLength={20}
                    value={profile.citizen_id_card ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProfile({ ...profile, citizen_id_card: v });
                      setErrors((prev) => ({
                        ...prev,
                        citizen_id_card: validateField("citizen_id_card", v),
                      }));
                    }}
                    className="rounded px-3 py-2 text-sm border border-border focus:border-primary focus:ring-0"
                  />
                ) : (
                  <div className="text-sm text-foreground px-3 py-2 bg-muted rounded">
                    {profile.citizen_id_card ?? ""}
                  </div>
                )}
                {errors.citizen_id_card && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.citizen_id_card}
                  </div>
                )}
              </div>
            </div>

            {/* Student Info Section */}
            {profile.role === "student" && profile.student && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Thông tin học tập</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    {
                      label: "Mã sinh viên",
                      value: profile.student.student_code ?? "",
                    },
                    {
                      label: "Trạng thái học tập",
                      value: translateAcademicStatus(
                        profile.student.academic_status ?? ""
                      ),
                    },
                    {
                      label: "Năm học",
                      value: profile.student.academic_year ?? "",
                    },
                    {
                      label: "Loại đào tạo",
                      value: translateTrainingType(
                        profile.student.type_of_tranning ?? ""
                      ),
                    },
                    {
                      label: "Trình độ đào tạo",
                      value: translateTrainingLevel(
                        profile.student.training_level ?? ""
                      ),
                    },
                    {
                      label: "Địa chỉ liên hệ",
                      value: profile.student.contact_address ?? "",
                      colSpan: "md:col-span-2",
                    },
                  ].map((field, idx) => (
                    <div key={idx} className={field.colSpan || ""}>
                      <Label className="text-xs text-muted-foreground">
                        {field.label}
                      </Label>
                      <div className="text-sm text-foreground px-3 py-2 mt-1 bg-muted rounded">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parent Children Info Section */}
            {profile.role === "parent" &&
              Array.isArray(profile.children) &&
              profile.children.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">Thông tin con cái</h3>
                  </div>
                  <div className="space-y-4">
                    {profile.children.map((child, idx) => (
                      <div
                        key={child.id ?? idx}
                        className="p-4 rounded-lg border border-border bg-card"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="md:col-span-2">
                            <Label className="text-xs text-muted-foreground">
                              Họ và tên
                            </Label>
                            <Input
                              value={child.users?.full_name ?? ""}
                              disabled
                              className="mt-1 bg-muted border border-border text-foreground rounded px-3 py-2 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Mã sinh viên
                            </Label>
                            <Input
                              value={child.student_code ?? ""}
                              disabled
                              className="mt-1 bg-muted border border-border text-foreground rounded px-3 py-2 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Lớp
                            </Label>
                            <Input
                              value={child.classes?.class_code ?? ""}
                              disabled
                              className="mt-1 bg-muted border border-border text-foreground rounded px-3 py-2 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Năm học
                            </Label>
                            <Input
                              value={child.academic_year ?? ""}
                              disabled
                              className="mt-1 bg-muted border border-border text-foreground rounded px-3 py-2 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Mối quan hệ
                            </Label>
                            <Input
                              value={translateRelationship(
                                child.relationship ?? ""
                              )}
                              disabled
                              className="mt-1 bg-muted border border-border text-foreground rounded px-3 py-2 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-border">
                <Button
                  onClick={handleSaveProfile}
                  disabled={disabled}
                  className="gap-2 px-5 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Lưu thay đổi
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="gap-2 px-5 py-2 rounded-md text-sm border border-border hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                  Hủy
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}