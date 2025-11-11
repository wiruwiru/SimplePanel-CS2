"use client"

import { useState, useEffect, useCallback } from "react"
import { VolumeX, Search, ChevronLeft, ChevronRight, MessageSquareOff, Mic, Volume2 } from "lucide-react"
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
    case 'UNMUTED':
      return { label: 'Desmuteado', className: 'bg-blue-600 text-white' };
    default:
      return { label: 'Desconocido', className: 'bg-zinc-700 text-white' };
  }
};

const getMuteTypeConfig = (type) => {
  switch (type?.toUpperCase()) {
    case 'GAG':
      return {
        label: 'Gag',
        icon: MessageSquareOff,
        className: 'bg-orange-600 text-white'
      };
    case 'MUTE':
      return {
        label: 'Mute',
        icon: Mic,
        className: 'bg-purple-600 text-white'
      };
    case 'SILENCE':
      return {
        label: 'Silence',
        icon: Volume2,
        className: 'bg-pink-600 text-white'
      };
    default:
      return {
        label: 'Desconocido',
        icon: VolumeX,
        className: 'bg-zinc-700 text-white'
      };
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

const MuteTypeBadge = ({ type }) => {
  const config = getMuteTypeConfig(type);
  const Icon = config.icon;
  
  return (
    <span className={`px-1 py-1 rounded-full text-xs font-medium flex justify-center gap-1.5 ${config.className}`}>
      <Icon className="size-3" />
      {config.label}
    </span>
  );
};

export function MuteList() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [mutes, setMutes] = useState([])
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

  const fetchMutes = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/sanctions/mutes?page=${currentPage}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(debouncedSearch)}`, { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setMutes(data.mutes)
        setTotal(data.total)

        const steamIds = data.mutes.map(mute => mute.steamId).filter(id => id && id !== "").join(",")
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
      console.error("Error fetching mutes:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch])

  useEffect(() => {
    fetchMutes()
  }, [fetchMutes])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getAvatarUrl = (steamId) => {
    return profiles[steamId]?.avatarUrl || "/placeholder.svg?height=40&width=40"
  }

  const getDisplayName = (mute) => {
    return profiles[mute.steamId]?.displayName || mute.player
  }

  const getProgressValue = (mute) => {
    if (mute.durationMinutes === 0) {
      return 100
    }
    
    if (mute.status === 'EXPIRED' || mute.status === 'UNMUTED') {
      return 100
    }

    if (!mute.created || !mute.ends) {
      return 0
    }

    const now = Date.now()
    const elapsed = now - mute.created
    const total = mute.ends - mute.created

    if (total <= 0) return 100
    if (elapsed >= total) return 100

    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }

  const getProgressColor = (mute) => {
    if (mute.durationMinutes === 0) {
      return 'bg-red-600'
    }
    
    if (mute.status === 'EXPIRED' || mute.status === 'UNMUTED') {
      return 'bg-green-600'
    }

    const progress = getProgressValue(mute)
    if (progress < 50) {
      return 'bg-orange-500'
    } else if (progress < 80) {
      return 'bg-yellow-500'
    } else {
      return 'bg-orange-600'
    }
  }

  const getRemainingMinutes = (mute) => {
    if (mute.durationMinutes === 0) {
      return "Permanente"
    }
    
    if (mute.status === 'EXPIRED' || mute.status === 'UNMUTED') {
      return "Finalizada"
    }

    if (!mute.ends) {
      return "Desconocido"
    }

    const now = Date.now()
    const remaining = mute.ends - now
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

  if (loading && mutes.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
        <div>
          <h2 className="text-zinc-100 mb-1">Lista de muteos</h2>
          <p className="text-zinc-400 text-sm md:text-base">Lista completa de los jugadores silenciados en nuestros servidores</p>
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
        <h2 className="text-zinc-100 mb-1">Lista de muteos</h2>
        <p className="text-zinc-400 text-sm md:text-base">Lista completa de los jugadores silenciados en nuestros servidores</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-100">
            <div className="flex items-center gap-2">
              <VolumeX className="size-5 text-[#FFB800]" />
              <span className="text-lg md:text-xl">Muteos ({total})</span>
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
          ) : mutes.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">No se han encontraron muteos</div>
          ) : (
            <>
              <div className="block lg:hidden space-y-3">
                {mutes.map((mute) => (
                  <div key={mute.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="size-10 shrink-0">
                          <AvatarImage src={getAvatarUrl(mute.steamId)} alt={mute.player} />
                          <AvatarFallback>{mute.player.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-zinc-100 mb-1 break-all">{getDisplayName(mute)}</div>
                          <div className="text-zinc-500 text-sm break-all">{mute.steamId}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <MuteTypeBadge type={mute.type} />
                        <StatusBadge status={mute.status} />
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="text-zinc-400">
                        <span className="text-zinc-500">Razón:</span> {mute.reason}
                      </div>
                      <div className="text-zinc-400">
                        <span className="text-zinc-500">Admin:</span> {mute.admin}
                      </div>
                      <div className="text-zinc-400">
                        <span className="text-zinc-500">Duración:</span> {mute.duration}
                      </div>
                      <div className="text-zinc-500 text-xs">{mute.date}</div>
                    </div>
                    <div className="pt-2">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="cursor-help">
                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                              <div className="h-full rounded-full transition-all" style={{width: `${getProgressValue(mute)}%`, backgroundColor: getProgressColor(mute) === 'bg-red-600' ? '#dc2626' : getProgressColor(mute) === 'bg-green-600' ? '#16a34a' : getProgressColor(mute) === 'bg-orange-500' ? '#f97316' : getProgressColor(mute) === 'bg-yellow-500' ? '#eab308' : getProgressColor(mute) === 'bg-orange-600' ? '#ea580c' : '#71717a'}} />
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-auto p-3 bg-zinc-800 border-zinc-700 text-zinc-100">
                          <div className="text-sm">
                            <div className="font-medium mb-1">Tiempo restante</div>
                            <div className="text-zinc-400">{getRemainingMinutes(mute)}</div>
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
                      <th className="text-left py-3 px-4 text-zinc-400">Razón</th>
                      <th className="text-left py-3 px-4 text-zinc-400">Admin</th>
                      <th className="text-left py-3 px-4 text-zinc-400">Duración</th>
                      <th className="text-left py-3 px-4 text-zinc-400">Progreso</th>
                      <th className="text-left py-3 px-4 text-zinc-400">Fecha de emisión</th>
                      <th className="text-left py-3 px-4 text-zinc-400">Tipo</th>
                      <th className="text-left py-3 px-4 text-zinc-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mutes.map((mute) => (
                      <tr key={mute.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <a href={`https://steamcommunity.com/profiles/${mute.steamId}`} target="_blank" rel="noopener noreferrer" >
                              <Avatar className="size-8">
                                <AvatarImage src={getAvatarUrl(mute.steamId)} alt={mute.player} />
                                <AvatarFallback>{mute.player.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                            </a>
                            <span className="text-zinc-100">{getDisplayName(mute)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">{mute.reason}</td>
                        <td className="py-3 px-4 text-zinc-400">{mute.admin}</td>
                        <td className="py-3 px-4 text-zinc-300">{mute.duration}</td>
                        <td className="py-3 px-4">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="w-24 cursor-help">
                                <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-700">
                                  <div className="h-full rounded-full transition-all" style={{width: `${getProgressValue(mute)}%`, backgroundColor: getProgressColor(mute) === 'bg-red-600' ? '#dc2626' : getProgressColor(mute) === 'bg-green-600' ? '#16a34a' : getProgressColor(mute) === 'bg-orange-500' ? '#f97316' : getProgressColor(mute) === 'bg-yellow-500' ? '#eab308' : getProgressColor(mute) === 'bg-orange-600' ? '#ea580c' : '#71717a'}} />
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto p-3 bg-zinc-800 border-zinc-700 text-zinc-100">
                              <div className="text-sm">
                                <div className="font-medium mb-1">Tiempo restante</div>
                                <div className="text-zinc-400">{getRemainingMinutes(mute)}</div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-sm">{mute.date}</td>
                        <td className="py-3 px-4">
                          <MuteTypeBadge type={mute.type} />
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={mute.status} />
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
              <div className="text-zinc-400 text-sm">
                Mostrando {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, total)} de {total}
              </div>
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
                      <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNum)} className={currentPage === pageNum ? "bg-[#FFB800] hover:bg-[#ce9300]" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"} >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
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