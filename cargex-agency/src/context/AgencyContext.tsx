"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { API_URL } from "@/lib/config";
import axios, { AxiosInstance } from "axios";

type AgencyUser = {
  _id: string;
  name: string;
  ownerName: string;
  email: string;
  status: string;
};

type AgencyContextType = {
  user: AgencyUser | null;
  loading: boolean;
  login: (token: string, userData: AgencyUser) => void;
  logout: () => void;
  api: AxiosInstance;
};

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AgencyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const api = axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("agencyToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const token = localStorage.getItem("agencyToken");
    const userData = localStorage.getItem("agencyUser");

    if (token && userData) {
      setUser(JSON.parse(userData));
    } else {
      if (pathname !== "/login") {
        router.push("/login");
      }
    }
    setLoading(false);
  }, [pathname, router]);

  const login = (token: string, userData: AgencyUser) => {
    localStorage.setItem("agencyToken", token);
    localStorage.setItem("agencyUser", JSON.stringify(userData));
    setUser(userData);
    router.push("/");
  };

  const logout = () => {
    localStorage.removeItem("agencyToken");
    localStorage.removeItem("agencyUser");
    setUser(null);
    router.push("/login");
  };

  return (
    <AgencyContext.Provider value={{ user, loading, login, logout, api }}>
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgency() {
  const context = useContext(AgencyContext);
  if (context === undefined) {
    throw new Error("useAgency must be used within an AgencyProvider");
  }
  return context;
}
