import Navbar from "@/components/navbar"

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Trang dashboard admin
          </h1>
          <p className="text-muted-foreground">
            Chào mừng bạn đến với hệ thống quản lý lớp học và lịch hẹn.
          </p>
        </div>
      </div>
    </div>
  )
}