"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Bell, 
  AlertTriangle,
  Calendar
} from "lucide-react";
import { DashboardStats, StatCard } from "./types";
import { 
  processRole, 
  processStatus, 
  processNotificationType, 
  processNotificationCategory,
  processWarningLevel,
  processAppointmentStatus,
  mergeUnknownItems
} from "./utils";
import { StatCards } from "./StatCards";
import { UsersByRoleChart } from "./UsersByRoleChart";
import { UsersByStatusChart } from "./UsersByStatusChart";
import { NotificationsByTypeChart } from "./NotificationsByTypeChart";
import { NotificationsByCategoryChart } from "./NotificationsByCategoryChart";
import { WarningsByLevelChart } from "./WarningsByLevelChart";
import { AppointmentsByStatusChart } from "./AppointmentsByStatusChart";
import { RecentActivityChart } from "./RecentActivityChart";
import { QuickActions } from "./QuickActions";

export function AdminDashboard() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalNotifications: 0,
    totalWarnings: 0,
    totalAppointments: 0,
    totalMessages: 0,
    totalConversations: 0,
    usersByRole: [],
    usersByStatus: [],
    notificationsByType: [],
    notificationsByCategory: [],
    warningsByLevel: [],
    recentActivity: [],
    appointmentsByStatus: []
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
        if (!token) return;

        // Fetch all data in parallel
        const [
          usersRes,
          notificationsRes,
          warningsCountRes,
          warningsByLevelRes,
          appointmentsRes,
          conversationsRes
        ] = await Promise.all([
          fetch(`${API_BASE}/api/users?page=1&limit=10000`, {
            headers: { "Authorization": `Bearer ${token}` },
            credentials: "include",
          }),
          fetch(`${API_BASE}/api/notifications?page=1&pageSize=10000`, {
            headers: { "Authorization": `Bearer ${token}` },
            credentials: "include",
          }),
          fetch(`${API_BASE}/api/academic-warnings/count`, {
            headers: { "Authorization": `Bearer ${token}` },
            credentials: "include",
          }),
          fetch(`${API_BASE}/api/academic-warnings/by-level`, {
            headers: { "Authorization": `Bearer ${token}` },
            credentials: "include",
          }),
          fetch(`${API_BASE}/api/appointments`, {
            headers: { "Authorization": `Bearer ${token}` },
            credentials: "include",
          }),
          fetch(`${API_BASE}/api/conversations`, {
            headers: { "Authorization": `Bearer ${token}` },
            credentials: "include",
          })
        ]);

        // Process users data
        let usersByRole: { role: string; count: number }[] = [];
        let usersByStatus: { status: string; count: number }[] = [];
        let totalUsers = 0;

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData?.returnCode === 0 && usersData?.data?.users) {
            const users = usersData.data.users;
            totalUsers = usersData.data.pagination?.total || users.length;

            // Group by role
            const roleMap = new Map<string, number>();
            const statusMap = new Map<string, number>();

            users.forEach((user: any) => {
              const role = processRole(user.role);
              roleMap.set(role, (roleMap.get(role) || 0) + 1);

              const status = processStatus(user.status);
              statusMap.set(status, (statusMap.get(status) || 0) + 1);
            });

            usersByRole = Array.from(roleMap.entries()).map(([role, count]) => ({
              role,
              count
            }));

            usersByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
              status,
              count
            }));

            // Merge unknown items
            usersByRole = mergeUnknownItems(usersByRole, "role");
            usersByStatus = mergeUnknownItems(usersByStatus, "status");
          }
        }

        // Process notifications data
        let notificationsByType: { type: string; count: number }[] = [];
        let notificationsByCategory: { category: string; count: number }[] = [];
        let totalNotifications = 0;
        let recentActivity: { date: string; users: number; notifications: number; warnings: number }[] = [];

        if (notificationsRes.ok) {
          const notifData = await notificationsRes.json();
          if (notifData?.returnCode === 0 && notifData?.data) {
            const notifications = Array.isArray(notifData.data) ? notifData.data : [];
            totalNotifications = notifData.meta?.total || notifications.length;

            const typeMap = new Map<string, number>();
            const categoryMap = new Map<string, number>();
            const activityMap = new Map<string, { users: number; notifications: number; warnings: number }>();

            notifications.forEach((notif: any) => {
              const type = processNotificationType(notif.type);
              typeMap.set(type, (typeMap.get(type) || 0) + 1);

              const category = processNotificationCategory(notif.category);
              categoryMap.set(category, (categoryMap.get(category) || 0) + 1);

              if (notif.created_at) {
                const date = new Date(notif.created_at).toLocaleDateString("vi-VN");
                const existing = activityMap.get(date) || { users: 0, notifications: 0, warnings: 0 };
                existing.notifications++;
                activityMap.set(date, existing);
              }
            });

            notificationsByType = Array.from(typeMap.entries()).map(([type, count]) => ({
              type,
              count
            }));

            notificationsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
              category,
              count
            }));

            // Merge unknown items
            notificationsByType = mergeUnknownItems(notificationsByType, "type");
            notificationsByCategory = mergeUnknownItems(notificationsByCategory, "category");

            // Get last 7 days activity
            const last7Days = Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              return date.toLocaleDateString("vi-VN");
            });

            recentActivity = last7Days.map(date => ({
              date: date.split("/").slice(0, 2).join("/"),
              users: 0,
              notifications: activityMap.get(date)?.notifications || 0,
              warnings: 0
            }));
          }
        }

        // Process warnings data
        let warningsByLevel: { level: string; count: number }[] = [];
        let totalWarnings = 0;

        // Get total warnings count from count API
        if (warningsCountRes.ok) {
          const countData = await warningsCountRes.json();
          if (countData?.returnCode === 0 && countData?.data?.count !== undefined) {
            totalWarnings = countData.data.count;
          }
        }

        // Get warnings by level from by-level API (số cảnh cáo thực tế theo level)
        if (warningsByLevelRes.ok) {
          const levelData = await warningsByLevelRes.json();
          if (levelData?.returnCode === 0 && levelData?.data) {
            const levels = Array.isArray(levelData.data) ? levelData.data : [];
            
            warningsByLevel = levels.map((item: any) => ({
              level: processWarningLevel(item.level),
              count: item.count || 0
            }));

            // Merge unknown items
            warningsByLevel = mergeUnknownItems(warningsByLevel, "level");
          }
        }

        // Process appointments data
        let totalAppointments = 0;
        let appointmentsByStatus: { status: string; count: number }[] = [];

        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          if (Array.isArray(appointmentsData)) {
            totalAppointments = appointmentsData.length;
            const statusMap = new Map<string, number>();
            appointmentsData.forEach((apt: any) => {
              const status = processAppointmentStatus(apt.status);
              statusMap.set(status, (statusMap.get(status) || 0) + 1);
            });
            appointmentsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
              status,
              count
            }));

            // Merge unknown items
            appointmentsByStatus = mergeUnknownItems(appointmentsByStatus, "status");
          }
        }

        // Process conversations data
        let totalConversations = 0;
        let totalMessages = 0;

        if (conversationsRes.ok) {
          const conversationsData = await conversationsRes.json();
          if (Array.isArray(conversationsData)) {
            totalConversations = conversationsData.length;
            // Estimate messages (could be improved with actual API)
            totalMessages = totalConversations * 10; // Rough estimate
          }
        }

        setStats({
          totalUsers,
          totalNotifications,
          totalWarnings,
          totalAppointments,
          totalMessages,
          totalConversations,
          usersByRole,
          usersByStatus,
          notificationsByType,
          notificationsByCategory,
          warningsByLevel,
          recentActivity,
          appointmentsByStatus
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [API_BASE]);

  const statCards: StatCard[] = [
    {
      title: "Tổng số tài khoản",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-500/15",
      hoverBorder: "hover:border-blue-500",
      hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-50/10",
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
      link: "/admin/notifications-management",
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
      link: "/admin/statistics",
    },
    {
      title: "Lịch hẹn",
      value: stats.totalAppointments,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-500/15",
      hoverBorder: "hover:border-green-500",
      hoverBg: "hover:bg-green-50 dark:hover:bg-green-500/10",
      description: "Tổng số lịch hẹn",
      link: "/admin/notifications-management",
    },
  ];

  return (
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Bảng điều khiển</h1>
        <p className="text-muted-foreground">Tổng quan hệ thống và thống kê chi tiết</p>
      </div>

      {/* Stat Cards Grid */}
      <StatCards cards={statCards} loading={loading} />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UsersByRoleChart data={stats.usersByRole} loading={loading} />
        <UsersByStatusChart data={stats.usersByStatus} loading={loading} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NotificationsByTypeChart data={stats.notificationsByType} loading={loading} />
        <NotificationsByCategoryChart data={stats.notificationsByCategory} loading={loading} />
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WarningsByLevelChart data={stats.warningsByLevel} loading={loading} />
        <AppointmentsByStatusChart data={stats.appointmentsByStatus} loading={loading} />
      </div>

      {/* Recent Activity - Area Chart */}
      <RecentActivityChart data={stats.recentActivity} loading={loading} />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
