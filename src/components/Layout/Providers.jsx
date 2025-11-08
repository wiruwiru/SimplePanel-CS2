"use client"

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { AuthProvider } from "@/contexts/AuthContext";

export function Providers({ children }) {
  return (
    <HeroUIProvider>
      <AuthProvider>
        {children}
        <ToastProvider />
      </AuthProvider>
    </HeroUIProvider>
  );
}