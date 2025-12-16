export interface DashboardStats {
  totalUsers: number;
  totalNotifications: number;
  totalWarnings: number;
  totalAppointments: number;
  totalMessages: number;
  totalConversations: number;
  usersByRole: { role: string; count: number }[];
  usersByStatus: { status: string; count: number }[];
  notificationsByType: { type: string; count: number }[];
  notificationsByCategory: { category: string; count: number }[];
  warningsByLevel: { level: string; count: number }[];
  recentActivity: { date: string; users: number; notifications: number; warnings: number }[];
  appointmentsByStatus: { status: string; count: number }[];
}

export interface StatCard {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  hoverBorder: string;
  hoverBg: string;
  description: string;
  link: string;
}

