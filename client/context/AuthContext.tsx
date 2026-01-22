import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User,
  getToken,
  getStoredUser,
  storeToken,
  storeUser,
  clearAuth,
} from "@/lib/auth";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await getToken();
      if (token) {
        const storedUser = await getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        }
        const response = await api.auth.me();
        if (response.data) {
          setUser(response.data);
          await storeUser(response.data);
        } else if (response.error) {
          await clearAuth();
          setUser(null);
        }
      }
    } catch (error) {
      await clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await api.auth.login(email, password);
    if (response.data) {
      await storeToken(response.data.token);
      await storeUser(response.data.user);
      setUser(response.data.user);
      return { success: true };
    }
    return { success: false, error: response.error };
  }

  async function logout() {
    await api.auth.logout();
    await clearAuth();
    setUser(null);
  }

  async function refreshUser() {
    const response = await api.auth.me();
    if (response.data) {
      setUser(response.data);
      await storeUser(response.data);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
