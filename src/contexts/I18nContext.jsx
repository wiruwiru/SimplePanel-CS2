"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { defaultLocale } from "@/lib/i18n"

const I18nContext = createContext(null)

const STORAGE_KEY = "simplepanel_language"

const getBrowserLocale = async (availableLocales) => {
  if (typeof window === "undefined") return defaultLocale
  const browserLang = navigator.language || navigator.userLanguage
  
  if (availableLocales.includes(browserLang)) {
    return browserLang
  }
  
  const langCode = browserLang.split("-")[0].toLowerCase()
  const matchingLocale = availableLocales.find(loc => loc.toLowerCase().startsWith(langCode))
  if (matchingLocale) {
    return matchingLocale
  }
  
  return defaultLocale
}

const getStoredLocale = (availableLocales) => {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored && availableLocales.includes(stored) ? stored : null
  } catch {
    return null
  }
}

const setStoredLocale = (locale) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {}
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(defaultLocale)
  const [translations, setTranslations] = useState({})
  const [loading, setLoading] = useState(true)
  const [availableLocales, setAvailableLocales] = useState([defaultLocale])
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const loadLocales = async () => {
      try {
        const response = await fetch('/api/locales', { cache: 'no-store' })
        if (response.ok) {
          const { locales } = await response.json()
          if (locales && locales.length > 0) {
            setAvailableLocales(locales)
          }
        }
      } catch (error) {
        console.error('Error loading locales:', error)
      }
    }
    loadLocales()
  }, [])

  const loadTranslations = useCallback(async (localeCode) => {
    try {
      const response = await fetch(`/lang/${localeCode}.json`)
      if (!response.ok) {
        throw new Error(`Failed to load locale: ${localeCode}`)
      }
      const data = await response.json()
      setTranslations(data)
      setLocale(localeCode)
      setStoredLocale(localeCode)
    } catch (error) {
      console.error("Error loading translations:", error)
      if (localeCode !== defaultLocale) {
        loadTranslations(defaultLocale)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialized || availableLocales.length === 0) return
    
    const initializeLocale = async () => {
      setInitialized(true)
      const stored = getStoredLocale(availableLocales)
      const browserLocale = await getBrowserLocale(availableLocales)
      const initialLocale = stored || browserLocale
      
      if (availableLocales.includes(initialLocale)) {
        loadTranslations(initialLocale)
      } else {
        loadTranslations(defaultLocale)
      }
    }
    
    initializeLocale()
  }, [availableLocales, initialized, loadTranslations])

  const changeLanguage = useCallback((localeCode) => {
    if (availableLocales.includes(localeCode)) {
      setLoading(true)
      loadTranslations(localeCode)
    }
  }, [availableLocales, loadTranslations])

  const t = useCallback((key, params = {}) => {
    const keys = key.split(".")
    let value = translations
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        return key
      }
    }

    if (typeof value !== "string") {
      return key
    }

    let result = value
    Object.keys(params).forEach((paramKey) => {
      result = result.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), params[paramKey])
    })

    return result
  }, [translations])

  return (
    <I18nContext.Provider value={{ locale, language: locale, translations, loading, changeLanguage, t, availableLocales }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}