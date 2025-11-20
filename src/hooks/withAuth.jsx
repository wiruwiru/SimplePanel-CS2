"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { UnauthorizedAccess } from "@/components/Auth/UnauthorizedAccess"
import { AdminUnauthorized } from "@/components/Auth/AdminUnauthorized"

export default function withAuth(Component, requiredFlag = null) {
  return function AuthenticatedComponent(props) {
    const { user, loading, hasFlag } = useAuth()

    useEffect(() => {
      if (!loading) {
        if (!user) {
          return
        }

        if (requiredFlag && !hasFlag(requiredFlag)) {
          return
        }
      }
    }, [user, loading, hasFlag])

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: 'var(--theme-primary)' }}></div>
        </div>
      )
    }

    if (!user) {
      return <UnauthorizedAccess />
    }

    if (requiredFlag && !hasFlag(requiredFlag)) {
      return <AdminUnauthorized />
    }

    return <Component {...props} />
  }
}