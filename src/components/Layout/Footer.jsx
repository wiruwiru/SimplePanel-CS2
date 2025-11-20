"use client";

import Link from "next/link";
import { Palette } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/UI/select";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme, themes, changeTheme } = useTheme();

  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 mt-12">
      <div className="px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-4 sm:hidden">
            <div className="text-center text-zinc-400 text-sm">
              <p>
                &copy; {currentYear}{" "}
                <Link href="/" className="theme-link">CrisisGamer</Link>{" "} | Developed by{" "}
                <Link href="https://github.com/wiruwiru" target="_blank" rel="nofollow" className="theme-link">Luca.</Link>
              </p>
            </div>
            <Select value={theme} onValueChange={changeTheme}>
              <SelectTrigger className="max-w-[200px] bg-card border-border text-foreground theme-select-trigger">
                <Palette className="size-4" />
              <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {themes.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-foreground theme-select-item">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="hidden sm:grid sm:grid-cols-3 items-center gap-4">
            <div></div>

            <div className="text-center text-zinc-400 text-sm">
              <p>
                &copy; {currentYear}{" "}
                <Link href="/" className="theme-link">CrisisGamer
                </Link>{" "}| Developed by{" "}
                <Link href="https://github.com/wiruwiru" target="_blank" rel="nofollow" className="theme-link">Luca.</Link>
              </p>
            </div>

            <div className="flex items-center justify-end">
              <Select value={theme} onValueChange={changeTheme}>
                <SelectTrigger className="max-w-[200px] bg-card border-border text-foreground theme-select-trigger">
                  <Palette className="size-4" />
                <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {themes.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-foreground theme-select-item">
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}