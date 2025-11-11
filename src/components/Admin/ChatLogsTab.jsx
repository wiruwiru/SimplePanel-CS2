"use client"

import { useState, useEffect, useCallback } from "react"
import { MessageSquare, Search, ChevronLeft, ChevronRight, Filter, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Spinner } from "@/components/UI/spinner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"

const ITEMS_PER_PAGE = 20

const Select = ({ value, onChange, children, className = "" }) => (
  <select value={value} onChange={onChange} className={`bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] w-full ${className}`} >
    {children}
  </select>
)

const getTeamConfig = (team) => {
  switch (team) {
    case 0:
      return { label: "NONE", className: "bg-zinc-600 text-white" }
    case 1:
      return { label: "SPECT", className: "bg-gray-600 text-white" }
    case 2:
      return { label: "TT", className: "bg-yellow-600 text-white" }
    case 3:
      return { label: "CT", className: "bg-blue-600 text-white" }
    default:
      return { label: "Desconocido", className: "bg-zinc-700 text-white" }
  }
}

const TeamBadge = ({ team }) => {
  const config = getTeamConfig(team)
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

const MessageTypeBadge = ({ isTeam }) => {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        isTeam ? "bg-purple-600 text-white" : "bg-green-600 text-white"
      }`}
    >
      {isTeam ? "Team" : "Global"}
    </span>
  )
}

export function ChatLogsTab() {
  const { hasFlag } = useAuth()
  const [chatlogs, setChatlogs] = useState([])
  const [search, setSearch] = useState("")
  const [playerSearch, setPlayerSearch] = useState("")
  const [team, setTeam] = useState("")
  const [messageType, setMessageType] = useState("")
  const [serverId, setServerId] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [debouncedPlayerSearch, setDebouncedPlayerSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState({})
  const [servers, setServers] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  const canView = hasFlag("@web/chatlogs")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPlayerSearch(playerSearch)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [playerSearch])

  useEffect(() => {
    setCurrentPage(1)
  }, [team, messageType, serverId])

  const fetchServers = useCallback(async () => {
    try {
      let response = await fetch("/api/servers", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setServers(data.map(server => ({ id: server.id, name: server.name })))
        return
      }
      response = await fetch("/api/admin/servers", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setServers(data)
      }
    } catch (error) {
      console.error("Error fetching servers:", error)
    }
  }, [])

  const fetchChatlogs = useCallback(async () => {
    if (!canView) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      })

      if (debouncedSearch) params.append("search", debouncedSearch)
      if (debouncedPlayerSearch) params.append("playerSearch", debouncedPlayerSearch)
      if (team !== "") params.append("team", team)
      if (messageType !== "") params.append("messageType", messageType)
      if (serverId) params.append("serverId", serverId)

      const response = await fetch(`/api/admin/chatlogs?${params.toString()}`, { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setChatlogs(data.chatlogs)
        setTotal(data.total)

        const steamIds = data.chatlogs
          .map((log) => log.playerSteam64)
          .filter((id) => id && id !== "")
          .join(",")
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
      console.error("Error fetching chatlogs:", error)
    } finally {
      setLoading(false)
    }
  }, [canView, currentPage, debouncedSearch, debouncedPlayerSearch, team, messageType, serverId])

  useEffect(() => {
    if (canView) {
      fetchServers()
    }
  }, [canView, fetchServers])

  useEffect(() => {
    if (canView) {
      fetchChatlogs()
    }
  }, [canView, fetchChatlogs])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getAvatarUrl = (steamId) => {
    return profiles[steamId]?.avatarUrl || "/placeholder.svg?height=40&width=40"
  }

  const getDisplayName = (log) => {
    return profiles[log.playerSteam64]?.displayName || log.playerName
  }

  const clearFilters = () => {
    setTeam("")
    setMessageType("")
    setServerId("")
    setSearch("")
    setPlayerSearch("")
    setCurrentPage(1)
  }

  const hasActiveFilters = team !== "" || messageType !== "" || serverId !== "" || search !== "" || playerSearch !== ""

  if (!canView) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="text-center py-8 text-zinc-400">
            <MessageSquare className="size-12 mx-auto mb-4 text-zinc-600" />
            <p>No tienes permisos para ver los logs de chat.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-[#FFB800]" />
            <div>
              <CardTitle className="text-zinc-100">Logs de Chat</CardTitle>
              <p className="text-zinc-400 text-sm mt-1">Visualiza y filtra los mensajes del chat de los servidores</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700" >
            <Filter className="size-4 mr-2" />
            Filtros
            {hasActiveFilters && <span className="ml-2 px-1.5 py-0.5 bg-[#FFB800] text-black rounded-full text-xs">!</span>}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input placeholder="Buscar mensajes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input placeholder="Buscar por jugador (nombre o SteamID)..." value={playerSearch} onChange={(e) => setPlayerSearch(e.target.value)} className="pl-10 w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>

          {showFilters && (
            <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-300 font-medium">Filtros avanzados</span>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-zinc-400 hover:text-zinc-200" >
                    <X className="size-4 mr-1" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Equipo</label>
                  <Select value={team} onChange={(e) => setTeam(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="0">NONE</option>
                    <option value="1">SPECT</option>
                    <option value="2">TT</option>
                    <option value="3">CT</option>
                  </Select>
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Tipo de mensaje</label>
                  <Select value={messageType} onChange={(e) => setMessageType(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="global">Global</option>
                    <option value="team">Team</option>
                  </Select>
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Servidor</label>
                  <Select value={serverId} onChange={(e) => setServerId(e.target.value)}>
                    <option value="">Todos los servidores</option>
                    {servers.map((server) => (
                      <option key={server.id} value={server.id}>
                        {server.name || `Servidor ${server.id}`}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6 text-[#FFB800]" />
          </div>
        ) : chatlogs.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">No se encontraron mensajes</div>
        ) : (
          <>
            <div className="space-y-2">
              {chatlogs.map((log) => (
                <div key={log.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <a href={`https://steamcommunity.com/profiles/${log.playerSteam64}`} target="_blank" rel="noopener noreferrer" >
                        <Avatar className="size-10 shrink-0">
                          <AvatarImage src={getAvatarUrl(log.playerSteam64)} alt={log.playerName} />
                          <AvatarFallback>{log.playerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </a>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-zinc-100 font-medium">{getDisplayName(log)}</span>
                          <span className="text-zinc-500 text-xs font-mono">({log.playerSteam64})</span>
                          <TeamBadge team={log.playerTeam} />
                          <MessageTypeBadge isTeam={log.isTeam} />
                        </div>
                        <div className="text-zinc-300 text-sm mb-2 warp-break-words">{log.message}</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                          <span>Servidor: {log.serverId}</span>
                          <span>{log.created}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
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
          </>
        )}
      </CardContent>
    </Card>
  )
}