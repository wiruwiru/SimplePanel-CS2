"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Palette, Globe } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useI18n } from "@/contexts/I18nContext";
import { getAvailableLocales, getLocaleName } from "@/lib/i18n";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/UI/select";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { theme, themes, changeTheme } = useTheme();
  const { locale, changeLanguage, availableLocales: contextLocales } = useI18n();
  const { t } = useI18n();
  const [availableLocales, setAvailableLocales] = useState([]);

  useEffect(() => {
    const loadLocales = async () => {
      const locales = await getAvailableLocales();
      setAvailableLocales(locales);
    };
    loadLocales();
  }, []);

  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 mt-12">
      <div className="px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-4 sm:hidden">
            <div className="text-center text-zinc-400 text-sm">
              <p>
                &copy; {currentYear}{" "}
                <Link href="https://github.com/wiruwiru/SimplePanel-CS2" target="_blank" rel="nofollow" className="theme-link">SimplePanel</Link>{" "} | {t("common.developed_by")}{" "}
                <Link href="https://github.com/wiruwiru" target="_blank" rel="nofollow" className="theme-link">Luca.</Link>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={locale} onValueChange={changeLanguage}>
                <SelectTrigger className="max-w-[200px] bg-card border-border text-foreground theme-select-trigger">
                  <Globe className="size-4" />
                  <SelectValue>
                    {locale && (availableLocales.find(l => l.code === locale)?.name || getLocaleName(locale))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {availableLocales.map((loc) => (
                    <SelectItem key={loc.code} value={loc.code} className="text-foreground theme-select-item">
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="hidden sm:grid sm:grid-cols-3 items-center gap-4">
            <div></div>

            <div className="text-center text-zinc-400 text-sm">
              <p>
                &copy; {currentYear}{" "}
                <Link href="https://github.com/wiruwiru/SimplePanel-CS2" target="_blank" rel="nofollow" className="theme-link">SimplePanel</Link>{" "}| {t("common.developed_by")}{" "}
                <Link href="https://github.com/wiruwiru" target="_blank" rel="nofollow" className="theme-link">Luca.</Link>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Select value={locale} onValueChange={changeLanguage}>
                <SelectTrigger className="max-w-[200px] bg-card border-border text-foreground theme-select-trigger">
                  <Globe className="size-4" />
                  <SelectValue>
                    {locale && (availableLocales.find(l => l.code === locale)?.name || getLocaleName(locale))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {availableLocales.map((loc) => (
                    <SelectItem key={loc.code} value={loc.code} className="text-foreground theme-select-item">
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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