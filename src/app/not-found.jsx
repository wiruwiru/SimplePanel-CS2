"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function NotFound() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

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
    <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-card to-background text-foreground min-h-[calc(100vh-8rem)]">
      <h1 className="mb-4 text-6xl font-bold" style={{ color: 'var(--theme-primary)' }}>404</h1>
      <h2 className="mb-4 text-2xl">Página no encontrada</h2>
      <p className="mb-8 text-center">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
        <br />
        Serás redirigido a la página principal en {countdown} segundo{countdown !== 1 ? "s" : ""}.
      </p>
      <Link href="/" className="rounded px-4 py-2 font-bold transition-colors" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; }}>
        Volver a la página principal
      </Link>
    </div>
  )
}