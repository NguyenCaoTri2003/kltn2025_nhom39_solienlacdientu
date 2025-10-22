import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchUserById } from "../services/userService";
import { useAuth } from "./AuthContext";
import { User } from "@packages/core/entities/UserRole";

interface UserContextType {
  userData: User | null;         
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  userData: null,
  loading: false,
  error: null,
  refreshUser: async () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth(); 
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadUser() {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const data = await fetchUserById(user.id);
      console.log("Fetched user data:", data);

      if (data) {
        setUserData(data); 
      } else {
        setError("Không tìm thấy thông tin người dùng.");
        setUserData(null);
      }
    } catch (e: any) {
      setError(e.message);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) loadUser();
    else setUserData(null);
  }, [user]);

  return (
    <UserContext.Provider value={{ userData, loading, error, refreshUser: loadUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);