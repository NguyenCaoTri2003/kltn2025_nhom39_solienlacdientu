"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Lock, Eye, EyeOff, CheckSquare, Square } from "lucide-react"
import { useUser } from "@/context/user-context"

export function StudentLoginForm() {
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [isParent, setIsParent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { refreshUser } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const role = isParent ? "parent" : "student";

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/studentorparent`,
        //  `/api/auth/login/studentorparent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ identifier: account, password, role }),
        }
      );

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        console.warn("API không trả JSON hợp lệ");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Đăng nhập thất bại");
      }

      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      if (data?.token) {
        localStorage.setItem("token", data.token);
      }

      try {
        await refreshUser();
      } catch (e) {
        console.warn("refreshUser lỗi:", e);
      }

      router.push("/portal"); 

    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  console.log("Render StudentLoginForm");

  return (
    <div className="flex items-center justify-center p-6">
      <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden">
        {/* Form đăng nhập */}
        <div className="md:w-3/5 bg-white p-12 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center tracking-tight">
            Đăng nhập
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Tài khoản */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Tài khoản"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="pl-12 py-3 rounded-xl border border-gray-300 focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] text-base"
                required
              />
            </div>

            {/* Mật khẩu */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 py-3 rounded-xl border border-gray-300 focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Checkbox dành cho phụ huynh */}
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => setIsParent(!isParent)}
                className="flex items-center gap-2 text-gray-700 hover:text-[#1565C0] transition text-sm font-medium"
              >
                {isParent ? (
                  <CheckSquare size={18} className="text-[#1565C0]" />
                ) : (
                  <Square size={18} className="text-gray-400" />
                )}
                <span>Dành cho phụ huynh</span>
              </button>
            </div>

            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            {/* Nút đăng nhập */}
            <Button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#42A5F5] to-[#64B5F6] text-white font-medium rounded-xl shadow hover:from-[#64B5F6] hover:to-[#42A5F5] text-base transition"
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </div>

        {/* Phần thông tin */}
        <div className="md:w-2/5 bg-[#BBDEFB] text-[#0D47A1] p-12 flex flex-col justify-center items-center text-center">
          <img src="/logo-iuh.png" alt="IUH Logo" className="h-28 w-28 object-contain" />
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Đại học Công nghiệp TP.HCM</h2>
          <p className="text-[#1565C0] max-w-sm text-sm leading-relaxed">
            Hệ thống Sổ Liên Lạc Điện Tử giúp quản lý thông tin sinh viên, trao đổi giữa nhà trường và phụ huynh, đảm bảo kết nối hiệu quả và minh bạch.
          </p>
        </div>
      </div>
    </div>
  )
}
