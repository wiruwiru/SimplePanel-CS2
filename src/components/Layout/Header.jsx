"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useI18n } from "@/contexts/I18nContext"
import { Shield, LogOut, User, Menu, X } from "lucide-react"
import { Button } from "@/components/UI/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/UI/dropdown-menu"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading, login, logout, isAdmin } = useAuth()
  const { t } = useI18n()

  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { id: "/", label: t("nav.home") },
    { id: "/bans", label: t("nav.bans") },
    { id: "/mutes", label: t("nav.mutes") },
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
            <Image src="/assets/logo.png" width={64} height={64} alt="SimplePanel-logo" />
            <h1 className="text-zinc-100 text-lg md:text-xl">{t("common.title")}</h1>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={`px-4 py-2 rounded-lg transition-colors ${pathname === item.id ? "text-white" : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"}`} style={pathname === item.id ? { backgroundColor: 'var(--theme-primary)' } : {}} >{item.label}</button>
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
                        <p className="text-sm font-medium leading-none text-zinc-100">{t("common.welcome")}, {user.displayName || t("common.user")}</p>
                        <p className="text-xs leading-none text-zinc-400">({user.steamId})</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    {isAdmin && (
                      <>
                        <DropdownMenuItem className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer" onClick={() => handleNavClick("/admin")} >
                          <Shield className="mr-2 h-4 w-4" />{t("nav.administration")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                      </>
                    )}
                    <DropdownMenuItem className="text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer" onClick={handleLogout} >
                      <LogOut className="mr-2 h-4 w-4" />{t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button variant="default" onClick={handleLogin} style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} className="hidden md:flex hover:opacity-90" onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; }}>
                <User className="size-4 mr-2" />{t("nav.login")}
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
              <button key={item.id} onClick={() => handleNavClick(item.id)} className={`w-full px-4 py-3 rounded-lg transition-colors text-left ${pathname === item.id ? "text-white" : "text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"}`} style={pathname === item.id ? { backgroundColor: 'var(--theme-primary)' } : {}} >{item.label}</button>
            ))}
            <div className="pt-2 border-t border-zinc-800">
              {loading ? (
                <div className="h-10 w-full bg-zinc-700 animate-pulse rounded-lg"></div>
              ) : user ? (
                <>
                  <div className="px-4 py-3 text-zinc-100">
                    <p className="font-medium">{t("common.welcome")}, {user.displayName || t("common.user")}</p>
                    <p className="text-xs text-zinc-400">({user.steamId})</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => {handleNavClick("/admin"), setMobileMenuOpen(false)}} className="w-full px-4 py-3 rounded-lg transition-colors text-left text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800" >
                      <Shield className="size-4 mr-2 inline" />{t("nav.administration")}
                    </button>
                  )}
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800" >
                    <LogOut className="size-4 mr-2" />{t("nav.logout")}
                  </Button>
                </>
              ) : (
                <Button variant="default" onClick={() => {handleLogin(), setMobileMenuOpen(false)}} className="w-full text-white" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; }}>
                  <User className="size-4 mr-2" />{t("nav.login")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}