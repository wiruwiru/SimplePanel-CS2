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
    <div className="flex flex-1 flex-col items-center justify-center bg-linear-to-b from-customColors-graydark to-customColors-background text-white">
      <h1 className="mb-4 text-6xl font-bold text-[#FFB800]">404</h1>
      <h2 className="mb-4 text-2xl">Página no encontrada</h2>
      <p className="mb-8 text-center">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
        <br />
        Serás redirigido a la página principal en {countdown} segundo{countdown !== 1 ? "s" : ""}.
      </p>
      <Link href="/" className="rounded bg-[#FFB800] px-4 py-2 font-bold text-black hover:bg-[#FFA500]">
        Volver a la página principal
      </Link>
    </div>
  )
}