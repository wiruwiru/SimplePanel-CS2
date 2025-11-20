"use client"

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <HeroUIProvider>
        <AuthProvider>
          {children}
          <ToastProvider />
        </AuthProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}