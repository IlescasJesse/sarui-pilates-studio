"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "instructor" | "reception" | "client";
  avatarUrl?: string;
}

interface ApiUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface ApiLoginData {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const TOKEN_KEY = "sarui_token";
const REFRESH_TOKEN_KEY = "sarui_refresh_token";
const USER_KEY = "sarui_user";

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem(TOKEN_KEY);
      if (stored && token) {
        setUser(JSON.parse(stored) as AuthUser);
      }
    } catch {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const res = await apiClient.post<ApiResponse<ApiLoginData>>("/auth/login", {
      email,
      password,
    });

    const { accessToken, refreshToken, user: apiUser } = res.data.data;

    const name =
      [apiUser.firstName, apiUser.lastName].filter(Boolean).join(" ") ||
      apiUser.email;

    const authUser: AuthUser = {
      id: apiUser.id,
      email: apiUser.email,
      name,
      role: apiUser.role.toLowerCase() as AuthUser["role"],
    };

    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };
}
