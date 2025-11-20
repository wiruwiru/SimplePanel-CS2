"use client"

import { useEffect } from "react"
import { useI18n } from "@/contexts/I18nContext"

export function LanguageSetter() {
  const { locale } = useI18n()

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale
    }
  }, [locale])

  return null
}