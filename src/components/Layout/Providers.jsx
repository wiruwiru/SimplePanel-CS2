"use client"

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { I18nProvider } from "@/contexts/I18nContext";

export function Providers({ children }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <HeroUIProvider>
          <AuthProvider>
            {children}
            <ToastProvider />
          </AuthProvider>
        </HeroUIProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}