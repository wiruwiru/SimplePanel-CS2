"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect } from "react"

export default function withAuth(Component, requiredFlag = null) {
  return function AuthenticatedComponent(props) {
    const { user, loading, hasFlag, flags } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.replace("/")
          return
        }

        if (requiredFlag && !hasFlag(requiredFlag)) {
          router.replace("/")
        }
      }
    }, [user, loading, hasFlag, router])

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )
    }

    if (!user || (requiredFlag && !hasFlag(requiredFlag))) {
      return null
    }

    return <Component {...props} />
  }
}