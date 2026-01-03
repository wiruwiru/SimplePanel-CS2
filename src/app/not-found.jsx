"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useI18n } from "@/contexts/I18nContext"

export default function NotFound() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)
  const { t } = useI18n()

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          router.push("/")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center text-foreground min-h-[calc(100vh-20rem)]">
      <h1 className="mb-4 text-6xl font-bold" style={{ color: 'var(--theme-primary)' }}>404</h1>
      <h2 className="mb-4 text-2xl">{t('not_found.title')}</h2>
      <p className="mb-8 text-center">
        {t('not_found.description')}
        <br />
        {t('not_found.redirecting')} {countdown} {countdown !== 1 ? t('auth.seconds_plural') : t('auth.seconds')}.
      </p>
      <Link href="/" className="rounded px-4 py-2 font-bold transition-colors" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; }}>
        {t('not_found.back_home')}
      </Link>
    </div>
  )
}