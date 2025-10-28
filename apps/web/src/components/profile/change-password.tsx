"use client"

import { useEffect, useState } from "react"
import NavbarClient from "@/components/navbar-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock, AlertCircle } from "lucide-react"
import { isValidPassword } from "@packages/utils/Regex"
import { PasswordStrengthChecker } from "@/components/profile/check-password"


type LoggedInUser = {
  id: number
  role: string
  full_name?: string
}

export default function ChangePassword() {
  const [user, setUser] = useState<LoggedInUser | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [currentPasswordError, setCurrentPasswordError] = useState<string>("")
  const [serverError, setServerError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const confirmMismatch = passwordData.confirmPassword.length > 0 && passwordData.newPassword !== passwordData.confirmPassword
  const weakNewPassword = passwordData.newPassword.length > 0 && !isValidPassword(passwordData.newPassword)
  const sameAsCurrent = passwordData.newPassword.length > 0 && passwordData.currentPassword.length > 0 && passwordData.newPassword === passwordData.currentPassword
  const allFilled = !!passwordData.currentPassword && !!passwordData.newPassword && !!passwordData.confirmPassword
  const isFormValid = allFilled && !confirmMismatch && !weakNewPassword && !sameAsCurrent
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) setUser(JSON.parse(userData))
  }, [])

  const handleChangePassword = async () => {
    if (!isFormValid) return
    setCurrentPasswordError("")
    setServerError("")
    setIsSubmitting(true)

    try {
      let token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))?.split("=")[1];
      if (!token) {
        token = localStorage.getItem("token") || undefined as unknown as string;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiBase}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data?.error === "Current password is incorrect") {
          setCurrentPasswordError("Mật khẩu hiện tại không đúng.")
        } else {
          setServerError(data?.error || "Đổi mật khẩu thất bại")
        }
        return
      }

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setMessage({ type: "success", text: "Đổi mật khẩu thành công!" })

      // setTimeout(() => {
      //   router.push("/")
      // }, 0) // thời gian delay thoát ra trang đăng nhập 0ms
    } catch (e) {
      setMessage({ type: "error", text: (e as Error)?.message || "Đổi mật khẩu thất bại" })

    }
    finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            ← Quay lại
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Đổi mật khẩu</h1>
          <p className="text-muted-foreground">Cập nhật mật khẩu để bảo mật tài khoản của bạn</p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Đổi mật khẩu</CardTitle>
            <CardDescription className="text-muted-foreground">
              Nhập mật khẩu hiện tại và mật khẩu mới
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          {/**Mở message */}
          {message && (
            <div
              className={`p-3 rounded-md text-sm flex items-center gap-2 ${
                message.type === "success"
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
              }`}
             >
              <AlertCircle className="w-4 h-4" />
               {message.text}
            </div>
          )}
          {/**Đóng message */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium">
                Mật khẩu hiện tại
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  maxLength={50}
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  if (currentPasswordError) setCurrentPasswordError("")
                }}
                  placeholder="Nhập mật khẩu hiện tại"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
              {currentPasswordError && (
                <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {currentPasswordError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">
                Mật khẩu mới
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  maxLength={50}
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Độ dài từ 8 đến 50 ký tự, gồm hoa, thường, số, ký tự đặc biệt"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
              <PasswordStrengthChecker password={passwordData.newPassword} />
              {/* {weakNewPassword && (
                <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  Mật khẩu phải có từ 8 đến 50 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                </p>
              )} */}
              {sameAsCurrent && (
                <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  Mật khẩu mới không được trùng với mật khẩu cũ.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Xác nhận mật khẩu mới
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  maxLength={50}
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu mới"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
              {confirmMismatch && (
                <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  Mật khẩu nhập lại không khớp với mật khẩu mới.
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              {serverError && (
                <p className="text-red-500 text-sm flex items-center gap-1 mb-3">
                  <AlertCircle className="w-4 h-4" />
                  {serverError}
                </p>
              )}
              <Button
                onClick={handleChangePassword}
                disabled={!isFormValid || isSubmitting}
                className="w-full sm:w-auto"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


