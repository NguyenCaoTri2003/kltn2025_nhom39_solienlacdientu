"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Bell, 
  AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalUsers: number;
  totalNotifications: number;
  totalWarnings: number;
}

export function AdminDashboard() {
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalNotifications: 0,
    totalWarnings: 0,
  });

  const getToken = () => {
    if (typeof window === "undefined") return null;
    const cookieToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
    return cookieToken || localStorage.getItem("token");
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = getToken();
        
        const [totalRes, notifRes, warningsRes] = await Promise.all([
          fetch(`${API_BASE}/api/users?page=1&limit=1`, {
            headers: { "Authorization": `Bearer ${token}` },
            credentials: "include",
          }),
          fetch(`${API_BASE}/api/notifications?page=1&pageSize=1`, {
            headers: { "Authorization": `Bearer ${token}` },
            credentials: "include",
          }),
          fetch(`${API_BASE}/api/academic-warnings/count`, {
            headers: { "Authorization": `Bearer ${token}` },
            credentials: "include",
          }),
        ]);

        if (totalRes.ok) {
          const totalData = await totalRes.json();
          if (totalData?.returnCode === 0 && totalData?.data?.pagination) {
            setStats(prev => ({
              ...prev,
              totalUsers: totalData.data.pagination.total || 0,
            }));
          }
        }

        if (notifRes.ok) {
          const notifData = await notifRes.json();
          if (notifData?.returnCode === 0 && notifData?.meta) {
            setStats(prev => ({
              ...prev,
              totalNotifications: notifData.meta.total || 0,
            }));
          }
        }

        if (warningsRes.ok) {
          const warningsData = await warningsRes.json();
          if (warningsData?.returnCode === 0 && warningsData?.data?.count !== undefined) {
            setStats(prev => ({
              ...prev,
              totalWarnings: warningsData.data.count || 0,
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [API_BASE]);

  const statCards = [
    {
      title: "Tổng số tài khoản",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-500/15",
      hoverBorder: "hover:border-blue-500",
      hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-500/10",
      description: "Tổng số người dùng trong hệ thống",
      link: "/admin/accounts/account-management",
    },
    {
      title: "Tổng số thông báo",
      value: stats.totalNotifications,
      icon: Bell,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-500/15",
      hoverBorder: "hover:border-purple-500",
      hoverBg: "hover:bg-purple-50 dark:hover:bg-purple-500/10",
      description: "Tổng số thông báo đã gửi",
      link: "admin/notifications-management",
    },
    {
      title: "Cảnh cáo học tập",
      value: stats.totalWarnings,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-500/15",
      hoverBorder: "hover:border-orange-500",
      hoverBg: "hover:bg-orange-50 dark:hover:bg-orange-500/10",
      description: "Tổng số cảnh cáo học tập",
      link: "admin/statistics",
    },
  ];

  const quickActions = [
    {
      title: "Quản lý tài khoản",
      description: "Quản lý người dùng và phân quyền",
      icon: Users,
      link: "/admin/accounts/account-management",
      color: "text-blue-600",
      hoverBorder: "hover:border-blue-500",
      hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-500/10",
    },
    {
      title: "Quản lý thông báo",
      description: "Tạo và quản lý thông báo",
      icon: Bell,
      link: "/admin/notifications-management",
      color: "text-purple-600",
      hoverBorder: "hover:border-purple-500",
      hoverBg: "hover:bg-purple-50 dark:hover:bg-purple-500/10",
    },
    {
      title: "Cảnh cáo học tập",
      description: "Xem và quản lý cảnh cáo học tập",
      icon: AlertTriangle,
      link: "/admin/statistics",
      color: "text-orange-600",
      hoverBorder: "hover:border-orange-500",
      hoverBg: "hover:bg-orange-50 dark:hover:bg-orange-500/10",
    },
  ];

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Bảng điều khiển</h1>
        <p className="text-muted-foreground">Tổng quan hệ thống và thống kê</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card 
              key={index} 
              className={`bg-card border-border hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 ${card.hoverBorder} ${card.hoverBg}`}
              onClick={() => router.push(card.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`${card.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {loading ? (
                    <span className="inline-block h-8 w-16 bg-muted animate-pulse rounded" />
                  ) : (
                    card.value.toLocaleString("vi-VN")
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card border-border mb-8">
        <CardHeader>
          <CardTitle className="text-card-foreground">Thao tác nhanh</CardTitle>
          <CardDescription className="text-muted-foreground">
            Truy cập nhanh các chức năng quản lý
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-start gap-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${action.hoverBorder} ${action.hoverBg}`}
                  onClick={() => router.push(action.link)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Icon className={`h-5 w-5 ${action.color}`} />
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-foreground">{action.title}</div>
                      <div className="text-sm text-muted-foreground">{action.description}</div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

