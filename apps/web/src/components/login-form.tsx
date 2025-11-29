"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Lock, Eye, EyeOff } from "lucide-react"


export function LoginForm() {
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/lectureroradmin`, {
       //const res = await fetch(`/api/auth/login/lectureroradmin`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: account, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Đăng nhập thất bại")

      console.log("Login successful:", data)

      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("token", data.token)

      if (data.user.role === "admin") router.push("/admin")
      else if (data.user.role === "lecturer") router.push("/lecturer")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center p-6">
      <div className="flex flex-col md:flex-row w-full max-w-6xl shadow-2xl rounded-3xl overflow-hidden">
        <div className="md:w-3/5 bg-white p-12 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1565C0] mb-8 text-center tracking-tight">
            Đăng nhập
          </h1>
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            <Button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#42A5F5] to-[#64B5F6] text-white font-medium rounded-xl shadow hover:from-[#64B5F6] hover:to-[#42A5F5] text-base transition"
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </div>

        <div className="md:w-2/5 bg-[#BBDEFB] text-[#0D47A1] p-12 flex flex-col justify-center items-center text-center">
          <img src="/logo-iuh.png" alt="IUH Logo" className="h-28 w-28 object-contain" />
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Đại học Công nghiệp TP.HCM</h2>
          <p className="text-[#1565C0] max-w-sm text-sm leading-relaxed">
            Hệ thống Sổ Liên Lạc Điện Tử giúp quản lý thông tin học sinh, trao đổi giữa nhà trường và phụ huynh, đảm bảo kết nối hiệu quả và minh bạch.
          </p>
        </div>
      </div>
    </div>
  )
}
