"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchUserById } from "@/services/userService";
import { User } from "@packages/core/entities/UserRole";

interface UserContextType {
  userData: User | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
}

const UserContext = createContext<UserContextType>({
  userData: null,
  loading: true,
  error: null,
  refreshUser: async () => {},
  clearUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadUser() {
    try {
      setLoading(true);
      setError(null);

      const currentUser =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("user") || "null")
          : null;
      const userId = currentUser?.id;

      if (!userId) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const user = await fetchUserById(Number(userId));
      setUserData(user);
    } catch (e: any) {
      console.error("UserProvider error:", e);
      setUserData(null);
      setError(e.message || "Lỗi tải thông tin người dùng");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") {
        loadUser();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    loadUser(); 

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <UserContext.Provider
      value={{
        userData,
        loading,
        error,
        refreshUser: loadUser,
        clearUser: () => setUserData(null),
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
