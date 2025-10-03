"use client"

import { useEffect, useState } from "react"
import NavbarClient from "@/components/navbar-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Mail, MapPin, Phone, Save } from "lucide-react"

interface UserProfileInfo {
  id: string
  name: string
  email: string
  phone: string
  address: string
  department: string
  position: string
  joinDate: string
  bio: string
}

type LoggedInUser = {
  id: number
  role: string
  full_name?: string
  name?: string
  avatar_url?: string | null
}

export default function PersonalProfile() {
  const [user, setUser] = useState<LoggedInUser | null>(null)
  const [profile, setProfile] = useState<UserProfileInfo>({
    id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    position: "",
    joinDate: "",
    bio: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
      return
    }

    const cookieUserRaw = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user="))?.split("=")[1]

    if (cookieUserRaw) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookieUserRaw))
        setUser(parsed)
      } catch {}
    }
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return

      try {
        let token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))?.split("=")[1];
        if (!token) {
          token = localStorage.getItem("token") || undefined as unknown as string;
        }

        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiBase}/api/users/${user.id}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        })

        if (!res.ok) return
        const data = await res.json()
        setProfile({
          id: String((data?.lecturer?.lecturer_code ?? data?.id) ?? ""),
          name: data.full_name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          department: "",
          position: "",
          joinDate: "",
          bio: "",
        })
      } catch {
        // ignore
      }
    }

    fetchProfile()
  }, [user])

  const handleSaveProfile = () => {
    console.log("Saving profile:", profile)
    setIsEditing(false)
    alert("Thông tin cá nhân đã được cập nhật thành công!")
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <NavbarClient
        userRole={user?.role === "admin" ? "admin" : user?.role === "lecturer" ? "teacher" : null}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Thông tin cá nhân</h1>
          <p className="text-muted-foreground">Cập nhật thông tin cá nhân của bạn</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                  <AvatarImage src="/teacher-avatar.png" />
                  <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                    {profile.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl sm:text-2xl text-card-foreground">{profile.name || user?.full_name || ""}</CardTitle>
                  <CardDescription className="text-muted-foreground">{profile.position}</CardDescription>
                  <p className="text-sm text-muted-foreground mt-1">{profile.department}</p>
                </div>
              </div>
              <Button
                onClick={() => setIsEditing(!isEditing)}
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
                  Mã
                </Label>
                <Input id="userId" value={profile.id} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Họ và tên
                </Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
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
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!isEditing}
                    className={`pl-10 ${!isEditing ? "bg-muted" : ""}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Số điện thoại
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditing}
                    className={`pl-10 ${!isEditing ? "bg-muted" : ""}`}
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Địa chỉ
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    disabled={!isEditing}
                    className={`pl-10 ${!isEditing ? "bg-muted" : ""}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium">
                  Đơn vị
                </Label>
                <Input
                  id="department"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joinDate" className="text-sm font-medium">
                  Ngày vào làm
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="joinDate"
                    type="date"
                    value={profile.joinDate}
                    onChange={(e) => setProfile({ ...profile, joinDate: e.target.value })}
                    disabled={!isEditing}
                    className={`pl-10 ${!isEditing ? "bg-muted" : ""}`}
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bio" className="text-sm font-medium">
                  Giới thiệu
                </Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  disabled={!isEditing}
                  className={`min-h-[100px] resize-none ${!isEditing ? "bg-muted" : ""}`}
                  placeholder="Mô tả ngắn về bản thân, kinh nghiệm..."
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button onClick={handleSaveProfile} className="flex-1 sm:flex-none">
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none">
                  Hủy
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


