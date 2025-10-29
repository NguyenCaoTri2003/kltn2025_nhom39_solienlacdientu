"use client";

import PersonalProfile from "@/components/profile/personal-profile";
import NavbarClient from "@/components/navbar-client";
import { useEffect, useState } from "react";

export default function Page() {
  const [user, setUser] = useState<{ id: number; full_name: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex flex-col">
      <NavbarClient 
        userRole="lecturer" 
        userName={user?.full_name || ""} 
        userId={user?.id || null}
      />
      <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <PersonalProfile />
      </div>
    </div>
  );
}


