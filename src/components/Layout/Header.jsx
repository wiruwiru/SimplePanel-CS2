"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Shield, LogOut, User, Menu, X } from "lucide-react"
import { Button } from "@/components/UI/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/UI/dropdown-menu"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading, login, logout, isAdmin } = useAuth()

  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { id: "/", label: "Inicio" },
    { id: "/bans", label: "Baneos" },
    { id: "/mutes", label: "Muteos" },
  ]

  const handleNavClick = (path) => {
    router.push(path)
    setMobileMenuOpen(false)
  }

  const handleLogin = async () => {
    await login()
  }

  const handleLogout = async () => {
    await logout()
    setMobileMenuOpen(false)
  }

  const getAvatarUrl = () => {
    if (user?.avatarUrl) {
      return user.avatarUrl
    }
    return "/placeholder.svg?height=40&width=40"
  }

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName.substring(0, 2).toUpperCase()
    }
    return "US"
  }

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/assets/logo.png" width={64} height={64} alt="CrisisGamer-logo" />
            <h1 className="text-zinc-100 text-lg md:text-xl">CrisisGamer</h1>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={`px-4 py-2 rounded-lg transition-colors ${pathname === item.id ? "bg-[#FFB800] text-white" : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"}`} >{item.label}</button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-zinc-700 animate-pulse"></div>
            ) : user ? (
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage src={getAvatarUrl() || "/placeholder.svg"} alt={user.displayName || "Usuario"} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-zinc-100">Bienvenido, {user.displayName || "Usuario"}</p>
                        <p className="text-xs leading-none text-zinc-400">({user.steamId})</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    {isAdmin && (
                      <>
                        <DropdownMenuItem className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer" onClick={() => handleNavClick("/admin")} >
                          <Shield className="mr-2 h-4 w-4" />Administración
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                      </>
                    )}
                    <DropdownMenuItem className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer" onClick={handleLogout} >
                      <LogOut className="mr-2 h-4 w-4" />Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button variant="default" onClick={handleLogin} className="bg-[#FFB800] hover:bg-[#ce9300] text-white hidden md:flex" >
                <User className="size-4 mr-2" />Iniciar sesión
              </Button>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg" >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-2 space-y-2">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={`w-full px-4 py-3 rounded-lg transition-colors text-left ${pathname === item.id ? "bg-[#FFB800] text-white" : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"}`} >{item.label}</button>
            ))}
            <div className="pt-2 border-t border-zinc-800">
              {loading ? (
                <div className="h-10 w-full bg-zinc-700 animate-pulse rounded-lg"></div>
              ) : user ? (
                <>
                  <div className="px-4 py-3 text-zinc-100">
                    <p className="font-medium">Bienvenido, {user.displayName || "Usuario"}</p>
                    <p className="text-xs text-zinc-400">({user.steamId})</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => {handleNavClick("/admin"), setMobileMenuOpen(false)}} className="w-full px-4 py-3 rounded-lg transition-colors text-left text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800" >
                      <Shield className="size-4 mr-2 inline" />Administración
                    </button>
                  )}
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800" >
                    <LogOut className="size-4 mr-2" />Cerrar sesión
                  </Button>
                </>
              ) : (
                <Button variant="default" onClick={() => {handleLogin(), setMobileMenuOpen(false)}} className="w-full bg-[#FFB800] hover:bg-[#ce9300] text-white" >
                  <User className="size-4 mr-2" />Iniciar sesión
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}