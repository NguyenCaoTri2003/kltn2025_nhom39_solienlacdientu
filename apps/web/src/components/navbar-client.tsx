"use client";

import Image from "next/image";
import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import NotificationDropdown from "@/components/notification/NotificationDropdown";
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
  KeyRound,
  Book,
  BellIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getAvatarColor } from "@/utils/color-hash";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessageCount";
import { useUser } from "@/context/user-context";

interface NavbarProps {
  userRole: "admin" | "lecturer" | "student" | "parent" | null;
  userName: string;
  avatarUrl?: string | null;
  userId?: number | null;
}

export default function NavbarClient({ userRole, userName, avatarUrl, userId }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { clearUser } = useUser();
  const unreadCount = useUnreadMessageCount();

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "user=; path=/; max-age=0";

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    clearUser();

    router.push(userRole === "student" || userRole === "parent" ? "/portal/login" : "/login");
    setTimeout(() => window.location.reload(), 200);
  };

  const adminNavItems = [
    { icon: Home, label: "Trang chủ", href: "/admin" },
    { icon: Users, label: "Quản lý tài khoản", href: "/admin/accounts/account-management" },
    { icon: BarChart3, label: "Tạo cảnh cáo", href: "/admin/statistics" },
  ];

  const teacherNavItems = [
    { icon: Home, label: "Trang chủ", href: "/lecturer" },
    { icon: Users, label: "Lớp học", href: "/lecturer/classes" },
    { icon: Calendar, label: "Lịch hẹn", href: "/lecturer/appointments" },
    { icon: MessageSquare, label: "Nhắn tin", href: "/lecturer/communications" },
    { icon: BellIcon, label: "Thông báo", href: "/lecturer/notifications" },
  ];

  const studentNavItems = [
    { icon: Home, label: "Trang chủ", href: "/portal" },
    { icon: Book, label: "Lớp học phần", href: "/portal/classes" },
    { icon: User, label: "Điểm danh", href: "/portal/attendances" },
    { icon: BarChart3, label: "Kết quả học tập", href: "/portal/grades" },
    { icon: MessageSquare, label: "Nhắn tin", href: "/portal/communications" },
    { icon: BellIcon, label: "Thông báo", href: "/portal/notifications" },
  ];

  const parentNavItems = [
    { icon: Home, label: "Trang chủ", href: "/portal" },
    { icon: Book, label: "Lớp học phần", href: "/portal/classes" },
    { icon: User, label: "Điểm danh", href: "/portal/attendances" },
    { icon: BarChart3, label: "Kết quả học tập", href: "/portal/grades" },
    { icon: Calendar, label: "Lịch hẹn", href: "/lecturer/appointments" },
    { icon: MessageSquare, label: "Nhắn tin", href: "/portal/communications" },
  ];

  const isActiveLink = (href: string) => {
    if (pathname === href) return true;
    if (pathname.startsWith(`${href}/`) && href !== "/lecturer" && href !== "/admin" && href !== "/portal") {
      return true;
    }
    return false;
  };

  const initial = useMemo(() => {

    const parts = userName.trim().split(" ");
    return parts[parts.length - 1]?.[0]?.toUpperCase() ?? "?";
  }, [userName]);

  const bgColor = useMemo(() => getAvatarColor(userId !== null && userId !== undefined ? String(userId) : userName), [userId, userName]);

  if (!userRole) {
    return null;
  }

  const roleBasePath = userRole === 'admin' ? '/admin' : userRole === 'lecturer' ? '/lecturer' : '/portal';
  const profilePath = (subPath: "infoV2" | "change-password") => `${roleBasePath}/profile/${subPath}`;
  const navItems = userRole === 'admin' ? adminNavItems : userRole === 'lecturer' ? teacherNavItems : userRole === 'student' ? studentNavItems : parentNavItems;

  if (userRole === 'student' || userRole === 'parent') {
    return (
      <nav className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo + Navigation */}
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push("/portal")} className="flex items-center">
                <Image
                  src="/logo-iuh-1.png"
                  alt="Logo IUH"
                  width={100}
                  height={100}
                  className="rounded-md cursor-pointer mb-1"
                  priority
                />
              </button>

              {/* Desktop nav */}
              <div className="hidden md:flex md:space-x-2">
                {navItems.map((item) => {
                  const active = isActiveLink(item.href);
                  return (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className={`cursor-pointer group relative flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 backdrop-blur-md ${active
                        ? "text-primary bg-gradient-to-r from-primary/20 to-blue-500/10 border border-primary/40 shadow-[0_4px_20px_rgba(59,130,246,0.2)] scale-[1.05]"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                        }`}
                    >
                      <item.icon className={`w-4 h-4 mr-2 transition-transform duration-300 ${active
                        ? "scale-110 text-primary"
                        : "group-hover:scale-110 group-hover:rotate-[8deg]"
                        }`} />
                      {item.label}
                      {active && (
                        <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-blue-500/10 animate-pulse pointer-events-none"></span>
                      )}
                      {item.icon === MessageSquare && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full px-[5px] py-[1px]">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User info */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <NotificationDropdown userRole={userRole} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="cursor-pointer relative w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold border border-border">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt={userName} fill className="object-cover" />
                    ) : (
                      <span className={`${bgColor} w-full h-full flex items-center justify-center`}>
                        {initial}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2 text-sm font-medium text-foreground truncate">
                    {userName}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(profilePath("infoV2"))}>
                    <User className="w-4 h-4 mr-2" /> Thông tin cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(profilePath("change-password"))}>
                    <KeyRound className="w-4 h-4 mr-2" /> Đổi mật khẩu
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2 text-destructive" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="md:hidden">
                <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-2 pt-2 pb-3 border-t border-border bg-card">
            {navItems.map((item) => {
              const active = isActiveLink(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                    }`}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </nav>
    );
  }
  if (userRole === 'admin') {
    return (
      <nav className="z-50">
        {/* Sidebar (desktop / md+) */}
        <div className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-60 md:flex-col bg-card border-r border-border">
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-border/60">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center cursor-pointer"
            >
              <Image
                src="/logo-iuh-1.png"
                alt="Logo IUH"
                width={120}
                height={120}
                className="rounded-md cursor-pointer"
                priority
              />
            </button>
          </div>
          {/* Nav items */}
          <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {navItems.map(item => {
              const active = isActiveLink(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`group w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all text-left ${active
                    ? 'bg-primary/15 text-primary border border-primary/40 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                >
                  <item.icon className={`w-4 h-4 ${active ? 'text-primary' : 'group-hover:scale-110 transition-transform'}`} />

                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          {/* Footer user actions */}
          <div className="border-t border-border p-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold border border-border ${bgColor}`}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={userName} width={40} height={40} className="object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">Tùy chọn</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => router.push(profilePath('infoV2'))}>
                    <User className="w-4 h-4 mr-2" /> Thông tin cá nhân
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(profilePath('change-password'))}>
                    <KeyRound className="w-4 h-4 mr-2" /> Đổi mật khẩu
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2 text-destructive" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Top bar (mobile only) */}
        <div className="md:hidden sticky top-0 bg-card border-b border-border z-50">
          <div className="h-16 flex items-center justify-between px-4">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center cursor-pointer"
            >
              <Image
                src="/logo-iuh-1.png"
                alt="Logo IUH"
                width={90}
                height={90}
                className="rounded-md cursor-pointer"
                priority
              />
            </button>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationDropdown userRole={userRole} />
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(o => !o)}>
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
          {isMobileMenuOpen && (
            <div className="px-2 pb-4 space-y-1 border-t border-border">
              {navItems.map(item => {
                const active = isActiveLink(item.href);
                return (
                  <button
                    key={item.href}
                    onClick={() => { router.push(item.href); setIsMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-left ${active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
              <div className="pt-2 border-t border-border mt-2 space-y-1">
                <button onClick={() => { router.push(profilePath('infoV2')); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                  <User className="w-4 h-4" /> Thông tin cá nhân
                </button>
                <button onClick={() => { router.push(profilePath('change-password')); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                  <KeyRound className="w-4 h-4" /> Đổi mật khẩu
                </button>
                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/90 hover:text-destructive-foreground">
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // ================= Teacher (original horizontal) Layout =================
  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo + Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(roleBasePath)}
              className="flex items-center cursor-pointer"
            >
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
                    className={`cursor-pointer group relative flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 backdrop-blur-md ${isActive
                      ? "text-primary bg-gradient-to-r from-primary/20 to-blue-500/10 border border-primary/40 shadow-[0_4px_20px_rgba(59,130,246,0.2)] scale-[1.05]"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                      }`}
                  >
                    <item.icon
                      className={`w-4 h-4 mr-2 transition-transform duration-300 ${isActive
                        ? "scale-110 text-primary"
                        : "group-hover:scale-110 group-hover:rotate-[8deg]"
                        }`}
                    />
                    {item.label}
                    {isActive && (
                      <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-blue-500/10 animate-pulse pointer-events-none"></span>
                    )}
                    {item.icon === MessageSquare && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full px-[5px] py-[1px]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User info + actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <NotificationDropdown />

            {/* Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="cursor-pointer relative w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold border border-border hover:opacity-90 transition">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={userName} fill className="object-cover" />
                  ) : (
                    <span className={`${bgColor} w-full h-full flex items-center justify-center`}>
                      {initial}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 text-sm font-medium text-foreground truncate">
                  {userName}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(profilePath("infoV2"))}>
                  <User className="w-4 h-4 mr-2" /> Thông tin cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(profilePath("change-password"))}>
                  <KeyRound className="w-4 h-4 mr-2" /> Đổi mật khẩu
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2 text-destructive" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
