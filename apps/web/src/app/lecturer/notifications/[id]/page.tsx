"use client";

import NotificationDetail from "@/components/notification/NotificationDetail";
import NavbarClient from "@/components/navbar-client";
import { useEffect, useState } from "react";
import Loading from "@/components/ui/loading";

export const dynamic = "force-dynamic";

interface NotificationDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function NotificationDetailPage({ params }: NotificationDetailPageProps) {
  const [user, setUser] = useState<{ id: number; full_name: string; avatar_url?: string } | null>(null);
  const [notificationId, setNotificationId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }

    params.then((resolvedParams) => {
      setNotificationId(resolvedParams.id);
    });
  }, [params]);

  if (!notificationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
        <NavbarClient
          userRole="lecturer"
          userName={user?.full_name || ""}
          userId={user?.id || null}
          avatarUrl={user?.avatar_url || null}
        />
        <Loading text="Đang tải thông báo..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <NavbarClient
        userRole="lecturer"
        userName={user?.full_name || ""}
        userId={user?.id || null}
        avatarUrl={user?.avatar_url || null}
      />
      <div className="flex-1">
        <NotificationDetail notificationId={notificationId} />
      </div>
    </div>
  );
}
