"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [flags, setFlags] = useState([])
  const router = useRouter()

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
        cache: "no-store",
      })
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          setIsAdmin(data.isAdmin || false)
          setFlags(data.flags || [])
        } else {
          setUser(null)
          setIsAdmin(false)
          setFlags([])
        }
      }
    } catch (error) {
      console.error("Error checking session:", error)
      setUser(null)
      setIsAdmin(false)
      setFlags([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkSession()

    const handleAuthMessage = (event) => {
      if (event.data === "auth_success") {
        checkSession()
      } else if (event.data === "auth_error") {
        console.error("Error en la autenticación")
        router.push("/auth/error?reason=failed")
      } else if (event.data === "auth_cancelled") {
        console.log("Autenticación cancelada")
        router.push("/auth/error?reason=cancelled")
      }
    }

    window.addEventListener("message", handleAuthMessage)

    return () => {
      window.removeEventListener("message", handleAuthMessage)
    }
  }, [checkSession, router])

  const login = useCallback(() => {
    const width = 600
    const height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const authWindow = window.open("/api/auth/steam", "Steam Login", `width=${width},height=${height},left=${left},top=${top}`)
    if (!authWindow) {
      alert("No se pudo abrir la ventana de autenticación. Por favor, permite los popups para este sitio.")
      return
    }

    const checkWindowClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkWindowClosed)
        setTimeout(() => {
          fetch("/api/auth/session", {
            credentials: "include",
            cache: "no-store",
          })
            .then(res => res.json())
            .then(data => {
              if (!data.user) {
                window.postMessage("auth_cancelled", window.location.origin)
              }
            })
            .catch(() => {
              window.postMessage("auth_cancelled", window.location.origin)
            })
        }, 500)
      }
    }, 500)
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      setUser(null)
      setIsAdmin(false)
      setFlags([])
      window.location.href = "/"
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }, [])

  const hasFlag = useCallback(
    (flag) => {
      if (flags.includes("@web/root")) return true
      return flags.includes(flag)
    },
    [flags],
  )

  return (
    <AuthContext.Provider value={{user, loading, isAdmin, flags, hasFlag, login, logout, checkSession}} >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}