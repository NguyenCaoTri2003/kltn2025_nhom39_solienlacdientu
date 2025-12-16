"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Bell, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  link: string;
  color: string;
  hoverBorder: string;
  hoverBg: string;
}

const quickActions: QuickAction[] = [
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

export function QuickActions() {
  const router = useRouter();

  return (
    <Card className="bg-card border-border">
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
  );
}

