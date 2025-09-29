"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Home, Users, Calendar, BarChart3, MessageSquare, Settings, LogOut, Menu, X, User } from "lucide-react"

interface NavbarProps {
  userRole: "admin" | "teacher"
  userName: string
}

export function Navbar({ userRole, userName }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const adminNavItems = [
    { icon: Home, label: "Trang chủ", href: "/admin" },
    { icon: Users, label: "Quản lý tài khoản", href: "/admin/accounts" },
    { icon: Calendar, label: "Quản lý lịch hẹn", href: "/admin/appointments" },
    { icon: MessageSquare, label: "Trung tâm liên lạc", href: "/admin/communications" },
    { icon: BarChart3, label: "Thống kê", href: "/admin/statistics" },
    { icon: Settings, label: "Cài đặt", href: "/admin/settings" },
  ]

  const teacherNavItems = [
    { icon: Home, label: "Trang chủ", href: "/teacher" },
    { icon: Users, label: "Lớp học", href: "/teacher/classes" },
    { icon: Calendar, label: "Lịch hẹn", href: "/teacher/appointments" },
    { icon: MessageSquare, label: "Tương tác", href: "/teacher/communications" },
    { icon: BarChart3, label: "Thống kê", href: "/teacher/statistics" },
    { icon: User, label: "Hồ sơ cá nhân", href: "/teacher/profile" },
  ]

  const navItems = userRole === "admin" ? adminNavItems : teacherNavItems

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">Sổ Liên Lạc</h1>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>

            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-card border-t border-border">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href)
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
