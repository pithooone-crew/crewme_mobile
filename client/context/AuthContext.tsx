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
import { mockUser } from "@/lib/mockData";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await getToken();
      if (token) {
        if (token === "demo-token") {
          setUser(mockUser);
          setIsDemoMode(true);
        } else {
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
      }
    } catch (error) {
      await clearAuth();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    // Demo mode: accept any email with "demo" in it or password "demo"
    if (email.toLowerCase().includes("demo") || password.toLowerCase() === "demo") {
      await storeToken("demo-token");
      await storeUser(mockUser);
      setUser(mockUser);
      setIsDemoMode(true);
      return { success: true };
    }

    const response = await api.auth.login(email, password);
    if (response.data) {
      await storeToken(response.data.token);
      await storeUser(response.data.user);
      setUser(response.data.user);
      setIsDemoMode(false);
      return { success: true };
    }
    
    // If network error, offer demo mode
    if (response.error?.includes("Network error")) {
      return { 
        success: false, 
        error: "Cannot connect to server. Use 'demo' as password to try the app in demo mode." 
      };
    }
    
    return { success: false, error: response.error };
  }

  async function logout() {
    if (!isDemoMode) {
      await api.auth.logout();
    }
    await clearAuth();
    setUser(null);
    setIsDemoMode(false);
  }

  async function refreshUser() {
    if (isDemoMode) {
      setUser(mockUser);
      return;
    }
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
        isDemoMode,
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
