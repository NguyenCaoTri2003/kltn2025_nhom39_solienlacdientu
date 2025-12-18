import NotificationDetail from "@/components/notification/NotificationDetail";
import NavbarClient from "@/components/navbar-client";
import { useEffect, useState } from "react";
import Loading from "@/components/ui/loading";
import Navbar from "@/components/navbar";

export const dynamic = "force-dynamic";


export default function NotificationDetailPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <Navbar />
      <div className="flex-1">
        <NotificationDetail/>
      </div>
    </div>
  );
}
