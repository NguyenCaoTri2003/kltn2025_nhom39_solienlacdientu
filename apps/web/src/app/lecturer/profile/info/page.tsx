"use client"

import { useEffect, useState } from "react";
import NavbarClient from "@/components/navbar-client";
import ProfilePage from "@/components/profile/profilePage";

export default function Page() {
  const [navProps, setNavProps] = useState({ userRole: null, userName: "", avatarUrl: null, userId: null });

  useEffect(() => {
    const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const user = userRaw ? JSON.parse(userRaw) : {};
    setNavProps({
      userRole: user.role || null,
      userName: user.full_name || "",
      avatarUrl: user.avatar_url || null,
      userId: user.id || null,
    });
  }, []);

  return (
    <>
      <NavbarClient {...navProps} />
      <ProfilePage />
    </>
  );
}


