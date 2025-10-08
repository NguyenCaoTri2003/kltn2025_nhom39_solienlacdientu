"use client";

import { useEffect, useMemo, useState } from "react";
import NavbarClient from "@/components/navbar-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Calendar, Mail, MapPin, Phone, Save } from "lucide-react";

import {
  isValidEmail,
  isValidPhone,
  isValidFullName,
  isValidCitizenId,
  isValidAddress,
  isValidEthnic,
} from "@packages/utils/Regex";

interface UserProfileInfo {
  id: string; // Mã hiển thị trên giao diện (tùy theo role)
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

  // Hiển thị tên cố định theo dữ liệu đã lưu (originalProfile) để khi đang chỉnh sửa
  // giá trị trong input thay đổi nhưng header/avatar không nhảy theo cho tới khi lưu
  const displayName =
    originalProfile?.full_name || user?.full_name || user?.name || "?";
  const initial = useMemo(() => {
    const parts = displayName.trim().split(" ");
    return parts[parts.length - 1]?.[0]?.toUpperCase() ?? "?";
  }, [displayName]);
  const bgColor = useMemo(() => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-amber-500",
      "bg-purple-500",
      "bg-rose-500",
      "bg-cyan-500",
      "bg-lime-500",
      "bg-pink-500",
    ];
    let hash = 0;
    for (let i = 0; i < displayName.length; i++) {
      hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }, [displayName]);

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
        };
        setProfile(mapped);
        setOriginalProfile(mapped);
      } catch {
        // ignore
      }
    };

    fetchProfile();
  }, [user]);

  // Validate từng trường
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

  // Lưu chỉnh sửa
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
        "full_name",
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

      // Cập nhật lại state bằng dữ liệu server trả về
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

  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    if (originalProfile) {
      setProfile(originalProfile);
      // Xóa hoặc re-validate để chắc chắn không còn lỗi hiển thị
      setErrors({});
    }
    setIsEditing(false);
  };

  if (!user) return null;
  ///
  console.log({
    hasError: Object.keys(errors).length > 0,
    hasOriginal: !!originalProfile,
    isChanged: JSON.stringify(profile) !== JSON.stringify(originalProfile),
    disabled:
      Object.keys(errors).length > 0 ||
      !originalProfile ||
      JSON.stringify(profile) === JSON.stringify(originalProfile),
  });
  const hasError = Object.keys(errors).length > 0;
  const hasOriginal = !!originalProfile;
  const isChanged = JSON.stringify(profile) !== JSON.stringify(originalProfile);
  console.log({ profile, originalProfile, hasError, hasOriginal, isChanged });

  const disabled =
    Object.values(errors).some((err) => err) || // chỉ disable nếu có giá trị lỗi thực sự
    !originalProfile ||
    JSON.stringify(profile) === JSON.stringify(originalProfile);

  console.log("Errors:", errors);
  console.log("Disabled:", disabled);
  ////

  return (
    <div className="min-h-screen bg-background">
      <NavbarClient
        userRole={
          user?.role === "admin"
            ? "admin"
            : user?.role === "lecturer"
            ? "teacher"
            : null
        }
        userName={user?.full_name || user?.name || ""}
        avatarUrl={user?.avatar_url || null}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            ← Quay lại
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Thông tin cá nhân
          </h1>
          <p className="text-muted-foreground">
            Cập nhật thông tin cá nhân của bạn
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} />
                  ) : null}
                  <AvatarFallback
                    className={`text-lg font-semibold ${bgColor} text-white`}
                  >
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl sm:text-2xl text-card-foreground truncate cursor-default max-w-[200px]" title={displayName}>
                    {displayName}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground capitalize">
                    {profile.role}
                  </CardDescription>
                </div>
              </div>

              <Button
                onClick={() => {
                  if (isEditing) {
                    handleCancelEdit(); // Gọi hàm hủy chỉnh sửa
                  } else {
                    setIsEditing(true); // Bật chế độ chỉnh sửa
                  }
                }}
                variant={isEditing ? "outline" : "default"}
                className="w-full sm:w-auto"
              >
                {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa thông tin"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-sm font-medium">
                  Mã {user?.role === "lecturer" ? "giảng viên" : "người dùng"}
                </Label>
                <Input
                  id="userId"
                  value={profile.id}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">
                  Họ và tên
                </Label>
                <Input
                  id="full_name"
                  maxLength={128}
                  value={profile.full_name ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setProfile({ ...profile, full_name: v });
                    setErrors((prev) => ({
                      ...prev,
                      full_name: validateField("full_name", v),
                    }));
                  }}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.full_name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    maxLength={255}
                    value={profile.email ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProfile({ ...profile, email: v });
                      setErrors((prev) => ({
                        ...prev,
                        email: validateField("email", v),
                      }));
                    }}
                    disabled={!isEditing}
                    className={`pl-10 ${!isEditing ? "bg-muted" : ""}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Số điện thoại
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
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
                    disabled={!isEditing}
                    className={`pl-10 ${!isEditing ? "bg-muted" : ""}`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Địa chỉ
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
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
                    disabled={!isEditing}
                    className={`pl-10 ${!isEditing ? "bg-muted" : ""}`}
                  />
                </div>
                {errors.address && (
                  <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ethnic" className="text-sm font-medium">
                  Dân tộc
                </Label>
                <Input
                  id="ethnic"
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
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
                {errors.ethnic && (
                  <p className="text-sm text-red-500 mt-1">{errors.ethnic}</p>
                )}
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Trạng thái
                </Label>
                <Input
                  id="status"
                  value={profile.status}
                  onChange={(e) =>
                    setProfile({ ...profile, status: e.target.value })
                  }
                  //disabled={!isEditing}
                  disabled
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div> */}
              <div className="space-y-2">
                <Label
                  htmlFor="citizen_id_card"
                  className="text-sm font-medium"
                >
                  CCCD
                </Label>
                <Input
                  id="citizen_id_card"
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
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
                {errors.citizen_id_card && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.citizen_id_card}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="created_at" className="text-sm font-medium">
                  Ngày tạo
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="created_at"
                    type="date"
                    value={
                      profile.created_at
                        ? new Date(profile.created_at)
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                    disabled
                    className={`pl-10 bg-muted`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_login" className="text-sm font-medium">
                  Đăng nhập gần nhất
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="last_login"
                    type="date"
                    value={
                      profile.last_login
                        ? new Date(profile.last_login)
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                    disabled
                    className={`pl-10 bg-muted`}
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 sm:flex-none"
                  disabled={disabled}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1 sm:flex-none"
                >
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
