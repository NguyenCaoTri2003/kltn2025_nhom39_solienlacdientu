"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Home, Users, Calendar, BarChart3, MessageSquare, User, LogOut, Menu, X } from "lucide-react";

interface NavbarProps {
  userRole: "admin" | "teacher" | null;
  userName: string;
}

export default function NavbarClient({ userRole, userName }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  if (!userRole) return null; 

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "user=; path=/; max-age=0";
    router.push("/login");
  };

  const adminNavItems = [
    { icon: Home, label: "Trang chủ", href: "/admin" },
    { icon: Users, label: "Quản lý tài khoản", href: "/admin/accounts" },
    { icon: Calendar, label: "Quản lý lịch hẹn", href: "/admin/appointments" },
    { icon: MessageSquare, label: "Trung tâm liên lạc", href: "/admin/communications" },
    { icon: BarChart3, label: "Thống kê", href: "/admin/statistics" },
  ];

  const teacherNavItems = [
    { icon: Home, label: "Trang chủ", href: "/dashboard" },
    { icon: Users, label: "Lớp học", href: "/classes" },
    { icon: Calendar, label: "Lịch hẹn", href: "/appointments" },
    { icon: MessageSquare, label: "Tương tác", href: "/communications" },
    { icon: BarChart3, label: "Thống kê", href: "/statistics" },
    { icon: User, label: "Hồ sơ cá nhân", href: "/profile" },
  ];

  const navItems = userRole === "admin" ? adminNavItems : teacherNavItems;

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">Sổ Liên Lạc</h1>
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
                  router.push(item.href);
                  setIsMobileMenuOpen(false);
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
  );
}
