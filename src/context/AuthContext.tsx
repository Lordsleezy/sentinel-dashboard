"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AUTH_STORAGE_KEY,
  DEFAULT_PASSWORD,
  PASSWORD_STORAGE_KEY,
} from "@/lib/config";

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  getPassword: () => string;
  updatePassword: (newPassword: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function getStoredPassword() {
  if (typeof window === "undefined") return DEFAULT_PASSWORD;
  return localStorage.getItem(PASSWORD_STORAGE_KEY) || DEFAULT_PASSWORD;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authed = localStorage.getItem(AUTH_STORAGE_KEY) === "true";
    setIsAuthenticated(authed);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const isLoginPage = pathname === "/signin";
    if (!isAuthenticated && !isLoginPage) {
      router.replace("/signin");
    } else if (isAuthenticated && isLoginPage) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  const login = useCallback((password: string) => {
    const valid = password === getStoredPassword();
    if (valid) {
      localStorage.setItem(AUTH_STORAGE_KEY, "true");
      setIsAuthenticated(true);
    }
    return valid;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    router.replace("/signin");
  }, [router]);

  const updatePassword = useCallback((newPassword: string) => {
    localStorage.setItem(PASSWORD_STORAGE_KEY, newPassword);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        getPassword: getStoredPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
