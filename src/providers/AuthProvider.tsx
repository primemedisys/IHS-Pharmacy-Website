"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { authService } from "@/services/auth.service";
import type { RegisterPayload } from "@/services/auth.service";
import type { RegisterableProviderType, User } from "@/types";
import { ROUTES } from "@/constants/routes";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Bootstrap: check for token and load user
  useEffect(() => {
    const token = Cookies.get("access_token");
    if (!token) {
      setLoading(false);
      if (pathname !== ROUTES.LOGIN && pathname !== ROUTES.REGISTER) {
        router.replace(ROUTES.LOGIN);
      }
      return;
    }

    authService
      .getMe()
      .then((u) => {
        setUser(u);
        // Redirect to dashboard if on auth pages
        if (pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER || pathname === ROUTES.HOME) {
          router.replace(ROUTES.DASHBOARD);
        }
      })
      .catch(() => {
        Cookies.remove("access_token");
        Cookies.remove("refresh_token");
        if (pathname !== ROUTES.LOGIN && pathname !== ROUTES.REGISTER) {
          router.replace(ROUTES.LOGIN);
        }
      })
      .finally(() => setLoading(false));
  }, [pathname, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: u, tokens } = await authService.login({ email, password });
      Cookies.set("access_token", tokens.accessToken, { expires: 1, sameSite: "lax", secure: typeof window !== "undefined" && window.location.protocol === "https:" });
      Cookies.set("refresh_token", tokens.refreshToken, { expires: 7, sameSite: "lax", secure: typeof window !== "undefined" && window.location.protocol === "https:" });
      setUser(u);
      router.push(ROUTES.DASHBOARD);
    },
    [router]
  );

  const register = useCallback(
    async (data: { name: string; email: string; password: string; phone?: string; role: RegisterableProviderType }) => {
      const { user: u, tokens } = await authService.register(data);
      Cookies.set("access_token", tokens.accessToken, { expires: 1, sameSite: "lax", secure: typeof window !== "undefined" && window.location.protocol === "https:" });
      Cookies.set("refresh_token", tokens.refreshToken, { expires: 7, sameSite: "lax", secure: typeof window !== "undefined" && window.location.protocol === "https:" });
      setUser(u);
      router.push(ROUTES.DASHBOARD);
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore — clear cookies regardless
    }
    Cookies.remove("access_token");
    Cookies.remove("refresh_token");
    setUser(null);
    router.push(ROUTES.LOGIN);
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
