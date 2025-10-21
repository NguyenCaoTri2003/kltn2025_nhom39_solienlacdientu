import React, { createContext, useContext, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { login as loginService } from "../services/authService";

interface AuthContextType {
  user: any | null;
  token: string | null;
  login: (identifier: string, password: string, role: "student" | "parent") => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  async function login(identifier: string, password: string, role: "student" | "parent") {
    const data = await loginService(identifier, password, role); 

    setUser(data.user);
    setToken(data.token);
    await SecureStore.setItemAsync("token", data.token);
    await SecureStore.setItemAsync("user", JSON.stringify(data.user));
  }

  async function logout() {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
