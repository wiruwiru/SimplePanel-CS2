"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardBody, CardHeader, CardFooter, Button } from "@heroui/react"
import { ShieldAlert, Home } from "lucide-react"

export function AdminUnauthorized() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/")
    }
  }, [countdown, router])

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="container mx-auto max-w-md mt-24">
        <Card className="bg-red-100 border-red-200">
          <CardHeader className="flex flex-col items-center gap-2 pb-0">
            <ShieldAlert className="h-16 w-16 text-red-500" />
            <h1 className="text-2xl font-bold text-zinc-900">Acceso denegado</h1>
          </CardHeader>
          <CardBody className="text-center">
            <p className="text-zinc-700">No tienes permisos para acceder a esta sección de administración.</p>
            <div className="mt-6 w-full rounded-lg bg-white/50 p-4 text-left">
              <h3 className="font-semibold text-zinc-900">¿Por qué no puedes acceder?</h3>
              <p className="mt-2 text-zinc-600">Esta área está restringida a usuarios con permisos de administrador específicos.</p>
            </div>
          </CardBody>
          <CardFooter className="flex flex-col items-center">
            <Button color="primary" onPress={() => router.push("/")} startContent={<Home className="h-4 w-4" />} >Volver al inicio</Button>
            <p className="mt-2 text-sm text-zinc-600">Redireccionando a la página principal en {countdown} segundo{countdown !== 1 ? "s" : ""}...</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}