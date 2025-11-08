"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardBody, CardHeader, CardFooter, Button } from "@heroui/react"
import { AlertTriangle, LogIn } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function AuthError() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason")
  const { login } = useAuth()
  const [countdown, setCountdown] = useState(10)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

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

  const handleLogin = async () => {
    setIsLoggingIn(true)
    try {
      await login()
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const getErrorContent = () => {
    switch (reason) {
      case "cancelled":
        return {
          title: "Inicio de sesión cancelado",
          message: "Has cancelado el proceso de inicio de sesión. Si fue por error, puedes intentarlo nuevamente.",
        }
      case "timeout":
        return {
          title: "Tiempo de espera agotado",
          message: "El proceso de inicio de sesión ha tardado demasiado tiempo. Por favor, inténtalo de nuevo.",
        }
      case "failed":
        return {
          title: "Error de autenticación",
          message: "No se pudo completar el proceso de autenticación. Por favor, inténtalo de nuevo más tarde.",
        }
      default:
        return {
          title: "Error de autenticación",
          message: "Ha ocurrido un error durante el proceso de autenticación. Por favor, inténtalo de nuevo.",
        }
    }
  }

  const { title, message } = getErrorContent()

  return (      
      <div className="flex-1 flex items-center justify-center">
        <div className="container mx-auto max-w-md mt-24">
          <Card className="bg-red-100 border-red-200">
            <CardHeader className="flex flex-col items-center gap-2 pb-0">
              <AlertTriangle className="h-16 w-16 text-red-500" />
              <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
            </CardHeader>
            <CardBody className="text-center">
              <p className="text-zinc-700">{message}</p>
              <div className="mt-6 w-full rounded-lg bg-white/50 p-4 text-left">
                <h3 className="font-semibold text-center text-zinc-900">¿Qué puedo hacer?</h3>
                <p className="mt-2 text-zinc-600">
                  Puedes intentar iniciar sesión nuevamente o volver a la página principal. Si el problema persiste, por
                  favor contacta con soporte.
                </p>
              </div>
            </CardBody>
            <CardFooter className="flex flex-col items-center">
              <Button color="primary" onPress={handleLogin} isLoading={isLoggingIn} isDisabled={isLoggingIn} startContent={<LogIn className="h-4 w-4" />} >
                {isLoggingIn ? "Conectando..." : "Intentar nuevamente"}
              </Button>
              <p className="mt-2 text-sm text-zinc-600">Redireccionando a la página principal en {countdown} segundo{countdown !== 1 ? "s" : ""}...</p>
            </CardFooter>
          </Card>
        </div>
      </div>
  )
}