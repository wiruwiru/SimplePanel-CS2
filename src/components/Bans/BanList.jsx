"use client"

import { useState, useEffect, useCallback } from "react"
import { Ban, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Input } from "@/components/UI/input"
import { Button } from "@/components/UI/button"
import { Spinner } from "@/components/UI/spinner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/UI/hover-card"

const ITEMS_PER_PAGE = 15

const getStatusConfig = (status) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return { label: 'Activo', className: 'bg-red-600 text-white' };
    case 'EXPIRED':
      return { label: 'Expirado', className: 'bg-green-600 text-white' };
    case 'UNBANNED':
      return { label: 'Desbaneado', className: 'bg-blue-600 text-white' };
    default:
      return { label: 'Desconocido', className: 'bg-zinc-700 text-white' };
  }
};

const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export function BanList() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [bans, setBans] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState({})

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchBans = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sanctions/bans?page=${currentPage}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(debouncedSearch)}`, { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setBans(data.bans)
        setTotal(data.total)

        const steamIds = data.bans.map(ban => ban.steamId).filter(id => id && id !== "").join(",")
        if (steamIds) {
          try {
            const profilesResponse = await fetch(`/api/profiles?ids=${steamIds}`)
            if (profilesResponse.ok) {
              const profilesData = await profilesResponse.json()
              setProfiles(profilesData)
            }
          } catch (error) {
            console.error("Error fetching profiles:", error)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching bans:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch])

  useEffect(() => {
    fetchBans()
  }, [fetchBans])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getAvatarUrl = (steamId) => {
    return profiles[steamId]?.avatarUrl || "/placeholder.svg?height=40&width=40"
  }

  const getDisplayName = (ban) => {
    return profiles[ban.steamId]?.displayName || ban.player
  }

  const getProgressValue = (ban) => {
    if (ban.durationMinutes === 0) {
      return 100
    }
    
    if (ban.status === 'EXPIRED' || ban.status === 'UNBANNED') {
      return 100
    }

    if (!ban.created || !ban.ends) {
      return 0
    }

    const now = Date.now()
    const elapsed = now - ban.created
    const total = ban.ends - ban.created

    if (total <= 0) return 100
    if (elapsed >= total) return 100

    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }

  const getProgressColor = (ban) => {
    if (ban.durationMinutes === 0) {
      return 'bg-red-600'
    }
    
    if (ban.status === 'EXPIRED' || ban.status === 'UNBANNED') {
      return 'bg-green-600'
    }

    const progress = getProgressValue(ban)
    if (progress < 50) {
      return 'bg-orange-500'
    } else if (progress < 80) {
      return 'bg-yellow-500'
    } else {
      return 'bg-orange-600'
    }
  }

  const getRemainingMinutes = (ban) => {
    if (ban.durationMinutes === 0) {
      return "Permanente"
    }
    
    if (ban.status === 'EXPIRED' || ban.status === 'UNBANNED') {
      return "Finalizada"
    }

    if (!ban.ends) {
      return "Desconocido"
    }

    const now = Date.now()
    const remaining = ban.ends - now

    if (remaining <= 0) {
      return "Finalizada"
    }

    const minutes = Math.floor(remaining / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) {
      return `${days} día${days > 1 ? 's' : ''} y ${hours % 24} hora${(hours % 24) !== 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''} y ${minutes % 60} minuto${(minutes % 60) !== 1 ? 's' : ''}`
    } else {
      return `${minutes} minuto${minutes !== 1 ? 's' : ''}`
    }
  }

  if (loading && bans.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-zinc-100 mb-1">Lista de baneos</h2>
          <p className="text-zinc-400 text-sm md:text-base">Lista completa de los jugadores baneados en nuestros servidores</p>
        </div>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <Spinner className="size-8 text-[#FFB800]" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-zinc-100 mb-1">Lista de baneos</h2>
        <p className="text-zinc-400 text-sm md:text-base">Lista completa de los jugadores baneados en nuestros servidores</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-100">
            <div className="flex items-center gap-2">
              <Ban className="size-5 text-[#FFB800]" />
              <span className="text-lg md:text-xl">Baneos ({total})</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                <Input placeholder="Buscar por nombre o SteamID64..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-100 w-full sm:w-64" />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6 text-[#FFB800]" />
            </div>
          ) : bans.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">No se han encontraron baneos</div>
          ) : (
            <>
              <div className="block lg:hidden space-y-3">
                {bans.map((ban) => (
                  <div key={ban.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="size-10 shrink-0">
                          <AvatarImage src={getAvatarUrl(ban.steamId)} alt={ban.player} />
                          <AvatarFallback>{ban.player.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-zinc-100 mb-1 break-all">{getDisplayName(ban)}</div>
                          <div className="text-zinc-500 text-sm break-all">{ban.steamId}</div>
                        </div>
                      </div>
                      <StatusBadge status={ban.status} />
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="text-zinc-400">
                        <span className="text-zinc-500">Razón:</span> {ban.reason}
                      </div>
                      <div className="text-zinc-400">
                        <span className="text-zinc-500">Admin:</span> {ban.admin}
                      </div>
                      <div className="text-zinc-400">
                        <span className="text-zinc-500">Duración:</span> {ban.duration}
                      </div>
                      <div className="text-zinc-500 text-xs">{ban.date}</div>
                    </div>
                    <div className="pt-2">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="cursor-help">
                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{width: `${getProgressValue(ban)}%`, backgroundColor: getProgressColor(ban) === 'bg-red-600' ? '#dc2626' : getProgressColor(ban) === 'bg-green-600' ? '#16a34a' : getProgressColor(ban) === 'bg-orange-500' ? '#f97316' : getProgressColor(ban) === 'bg-yellow-500' ? '#eab308' : getProgressColor(ban) === 'bg-orange-600' ? '#ea580c' : '#71717a'}} />
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-auto p-3 bg-zinc-800 border-zinc-700 text-zinc-100">
                          <div className="text-sm">
                            <div className="font-medium mb-1">Tiempo restante</div>
                            <div className="text-zinc-400">{getRemainingMinutes(ban)}</div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left py-3 px-4 text-zinc-400">Jugador</th>
                      {/* <th className="text-left py-3 px-4 text-zinc-400">SteamID64</th> */}
                      <th className="text-left py-3 px-4 text-zinc-400">Razón</th>
                      <th className="text-left py-3 px-4 text-zinc-400">Admin</th>
                      <th className="text-left py-3 px-4 text-zinc-400">Duración</th>
                      <th className="text-left py-3 px-4 text-zinc-400">Progreso</th>
                      <th className="text-left py-3 px-4 text-zinc-400">Fecha de emisión</th>
                      <th className="text-left py-3 px-4 text-zinc-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bans.map((ban) => (
                      <tr key={ban.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <a href={`https://steamcommunity.com/profiles/${ban.steamId}`} target="_blank" rel="noopener noreferrer" >
                              <Avatar className="size-8">
                                <AvatarImage src={getAvatarUrl(ban.steamId)} alt={ban.player} />
                                <AvatarFallback>{ban.player.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            </a>
                            <span className="text-zinc-100">{getDisplayName(ban)}</span>
                          </div>
                        </td>
                        {/* <td className="py-3 px-4 text-zinc-400 font-mono text-sm">{ban.steamId}</td> */}
                        <td className="py-3 px-4 text-zinc-300">{ban.reason}</td>
                        <td className="py-3 px-4 text-zinc-400">{ban.admin}</td>
                        <td className="py-3 px-4 text-zinc-300">{ban.duration}</td>
                        <td className="py-3 px-4">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="w-24 cursor-help">
                                <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                                  <div className="h-full rounded-full transition-all" style={{width: `${getProgressValue(ban)}%`, backgroundColor: getProgressColor(ban) === 'bg-red-600' ? '#dc2626' : getProgressColor(ban) === 'bg-green-600' ? '#16a34a' : getProgressColor(ban) === 'bg-orange-500' ? '#f97316' : getProgressColor(ban) === 'bg-yellow-500' ? '#eab308' : getProgressColor(ban) === 'bg-orange-600' ? '#ea580c' : '#71717a'}} />
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto p-3 bg-zinc-800 border-zinc-700 text-zinc-100">
                              <div className="text-sm">
                                <div className="font-medium mb-1">Tiempo restante</div>
                                <div className="text-zinc-400">{getRemainingMinutes(ban)}</div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-sm">{ban.date}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={ban.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
              <div className="text-zinc-400 text-sm">Mostrando {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, total)} de {total}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
                  <ChevronLeft className="size-4" />
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNum)} className={currentPage === pageNum ? "bg-[#FFB800] hover:bg-[#ce9300]" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"} >{pageNum}</Button>
                    )
                  })}
                </div>

                <Button variant="outline" 
                  size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
                  <span className="hidden sm:inline mr-1">Siguiente</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}