import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">SỔ LIÊN LẠC ĐIỆN TỬ</h1>
          <p className="text-muted-foreground">Hệ thống sổ liên lạc điện tử của trường Đại học Công Nghiệp TP.HCM</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
