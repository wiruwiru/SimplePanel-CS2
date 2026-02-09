"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardBody, CardHeader, CardFooter, Button } from "@heroui/react"
import { Lock, LogIn } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useI18n } from "@/contexts/I18nContext"

export function UnauthorizedAccess() {
  const router = useRouter()
  const { login } = useAuth()
  const [countdown, setCountdown] = useState(10)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const { t } = useI18n()

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

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="container mx-auto max-w-md mt-24">
        <Card className="bg-red-100 border-red-200">
          <CardHeader className="flex flex-col items-center gap-2 pb-0">
            <Lock className="h-16 w-16 text-red-500" />
            <h1 className="text-2xl font-bold text-zinc-900">{t('auth.restricted_access')}</h1>
          </CardHeader>
          <CardBody className="text-center">
            <p className="text-zinc-700">{t('auth.login_required')}</p>
            <div className="mt-6 w-full rounded-lg bg-white/50 p-4 text-left">
              <h3 className="font-semibold text-zinc-900">{t('auth.why_login')}</h3>
              <p className="mt-2 text-zinc-600">
                {t('auth.why_login_description')}
              </p>
            </div>
          </CardBody>
          <CardFooter className="flex flex-col items-center">
            <Button color="primary" onPress={handleLogin} isLoading={isLoggingIn} isDisabled={isLoggingIn} startContent={<LogIn className="h-4 w-4" />} >
              {isLoggingIn ? t('auth.connecting') : t('auth.login')}
            </Button>
            <p className="mt-2 text-sm text-zinc-600">{t('auth.redirecting')} {countdown} {countdown !== 1 ? t('auth.seconds_plural') : t('auth.seconds')}...</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}