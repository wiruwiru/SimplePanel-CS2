"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { defaultLocale } from "@/lib/i18n";

const I18nContext = createContext(null);
const STORAGE_KEY = "simplepanel_language";

const getBrowserLocale = (availableLocales) => {
  if (typeof window === "undefined") return null;
  const browserLang = navigator.language || navigator.userLanguage;

  if (availableLocales.includes(browserLang)) {
    return browserLang;
  }

  const langCode = browserLang.split("-")[0].toLowerCase();
  const matchingLocale = availableLocales.find((loc) => {
    const locCode = loc.split("-")[0].toLowerCase();
    return locCode === langCode;
  });

  if (matchingLocale) {
    return matchingLocale;
  }

  return null;
};

const getStoredLocale = () => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || null;
  } catch {
    return null;
  }
};

const setStoredLocale = (locale) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {}
};

export function I18nProvider({ children }) {
  const storedLocaleFromStorage = typeof window !== "undefined" ? getStoredLocale() : null;
  const [locale, setLocale] = useState(storedLocaleFromStorage || defaultLocale);
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [availableLocales, setAvailableLocales] = useState([defaultLocale]);
  const [initialized, setInitialized] = useState(false);
  const [configDefaultLang, setConfigDefaultLang] = useState(defaultLocale);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch("/api/config", { cache: "no-store" });
        if (response.ok) {
          const config = await response.json();
          if (config.defaultLang) {
            setConfigDefaultLang(config.defaultLang);
          }
        }
      } catch (error) {
        console.error("Error loading config:", error);
      }
    };
    loadConfig();
  }, []);

  const [localesLoaded, setLocalesLoaded] = useState(false);

  useEffect(() => {
    const loadLocales = async () => {
      try {
        const response = await fetch("/api/locales", { cache: "no-store" });
        if (response.ok) {
          const { locales } = await response.json();
          if (locales && locales.length > 0) {
            setAvailableLocales(locales);
            setLocalesLoaded(true);
          } else {
            setLocalesLoaded(true);
          }
        } else {
          setLocalesLoaded(true);
        }
      } catch (error) {
        console.error("Error loading locales:", error);
        setLocalesLoaded(true);
      }
    };
    loadLocales();
  }, []);

  const loadTranslations = useCallback(
    async (localeCode, fallbackLocale = null) => {
      try {
        const response = await fetch(`/lang/${localeCode}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load locale: ${localeCode}`);
        }
        const data = await response.json();
        setTranslations(data);
        setLocale(localeCode);
        setStoredLocale(localeCode);
      } catch (error) {
        console.error("Error loading translations:", error);
        const fallback = fallbackLocale || configDefaultLang || defaultLocale;
        if (localeCode !== fallback && fallback) {
          try {
            const fallbackResponse = await fetch(`/lang/${fallback}.json`);
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              setTranslations(fallbackData);
              setLocale(fallback);
              setStoredLocale(fallback);
            }
          } catch (fallbackError) {
            console.error(
              "Error loading fallback translations:",
              fallbackError
            );
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [configDefaultLang]
  );

  useEffect(() => {
    if (initialized || !localesLoaded || availableLocales.length === 0 || !configDefaultLang)
      return;

    const initializeLocale = () => {
      setInitialized(true);

      const stored = getStoredLocale();
      if (stored && availableLocales.includes(stored)) {
        loadTranslations(stored);
        return;
      }

      if (!stored) {
        const browserLocale = getBrowserLocale(availableLocales);
        if (browserLocale && availableLocales.includes(browserLocale)) {
          loadTranslations(browserLocale);
          return;
        }
      }

      if (availableLocales.includes(configDefaultLang)) {
        loadTranslations(configDefaultLang);
      } else {
        const fallback = availableLocales[0] || defaultLocale;
        loadTranslations(fallback);
      }
    };

    initializeLocale();
  }, [availableLocales, initialized, loadTranslations, configDefaultLang, localesLoaded]);

  const changeLanguage = useCallback(
    (localeCode) => {
      if (availableLocales.includes(localeCode)) {
        setLoading(true);
        loadTranslations(localeCode);
      }
    },
    [availableLocales, loadTranslations]
  );

  const t = useCallback(
    (key, params = {}) => {
      const keys = key.split(".");
      let value = translations;
      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          return key;
        }
      }

      if (typeof value !== "string") {
        return key;
      }

      let result = value;
      Object.keys(params).forEach((paramKey) => {
        result = result.replace(
          new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"),
          params[paramKey]
        );
      });

      return result;
    },
    [translations]
  );

  return (
    <I18nContext.Provider value={{ locale, language: locale, translations, loading, changeLanguage, t, availableLocales }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}