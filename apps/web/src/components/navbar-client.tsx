"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Home,
  Users,
  Calendar,
  BarChart3,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface NavbarProps {
  userRole: "admin" | "teacher" | null;
  userName: string;
}

export default function NavbarClient({ userRole, userName }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
    { icon: Home, label: "Trang chủ", href: "/lecturer" },
    { icon: Users, label: "Lớp học", href: "/lecturer/classes" },
    { icon: Calendar, label: "Lịch hẹn", href: "/lecturer/appointments" },
    { icon: MessageSquare, label: "Tương tác", href: "/lecturer/communications" },
    { icon: BarChart3, label: "Thống kê", href: "/lecturer/statistics" },
    { icon: User, label: "Hồ sơ cá nhân", href: "/lecturer/profile" },
  ];

  const navItems = userRole === "admin" ? adminNavItems : teacherNavItems;

  const isActiveLink = (href: string) => {
    if (pathname === href) return true;
    if (pathname.startsWith(`${href}/`) && href !== "/lecturer" && href !== "/admin") {
      return true;
    }
    return false;
  };

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo + Navigation */}
          <div className="flex items-center space-x-4">
            <button onClick={() => router.push("/lecturer")} className="flex items-center cursor-pointer">
              <Image
                src="/logo-iuh-1.png"
                alt="Logo IUH"
                width={100}
                height={120}
                className="rounded-md cursor-pointer mb-2"
                priority
              />
            </button>

            {/* Desktop nav */}
            <div className="hidden md:ml-6 md:flex md:space-x-2">
              {navItems.map((item) => {
                const isActive = isActiveLink(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`cursor-pointer group relative flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 backdrop-blur-md ${
                        isActive
                        ? "text-primary bg-gradient-to-r from-primary/20 to-blue-500/10 border border-primary/40 shadow-[0_4px_20px_rgba(59,130,246,0.2)] scale-[1.05]"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                      }`}
                  >
                    <item.icon
                      className={`w-4 h-4 mr-2 transition-transform duration-300 ${
                        isActive
                          ? "scale-110 text-primary"
                          : "group-hover:scale-110 group-hover:rotate-[8deg]"
                        }`}
                    />
                    {item.label}

                    {isActive && (
                      <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-blue-500/10 animate-pulse pointer-events-none"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User info + actions */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>

            {/* Mobile toggle */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
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
            {navItems.map((item) => {
              const isActive = isActiveLink(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
