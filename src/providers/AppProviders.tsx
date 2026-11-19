"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AppThemeProvider } from "@/theme/ThemeProvider";
import { AuthProvider } from "./AuthProvider";
import { QueryProvider } from "./QueryProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AppThemeProvider>
        <AuthProvider>
          {children}
          <Toaster richColors closeButton position="top-right" theme="system" />
        </AuthProvider>
      </AppThemeProvider>
    </QueryProvider>
  );
}
