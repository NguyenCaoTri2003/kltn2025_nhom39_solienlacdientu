import { LoginForm } from "@/components/login-form"
import AppBackground from "@/components/AppBackground"

export default function LoginPage() {
  return (
    <AppBackground>
    <div className="min-h-screen flex items-center justify-center  p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0D47A1] mb-2 tracking-tight">
            SỔ LIÊN LẠC ĐIỆN TỬ
          </h1>
          <p className="text-[#1565C0] text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Hệ thống sổ liên lạc điện tử của trường Đại học Công Nghiệp TP.HCM, hỗ trợ kết nối nhà trường, giảng viên và phụ huynh hiệu quả, minh bạch.
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
    </AppBackground>
  )
}
