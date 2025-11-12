"use client"

import { useState, useEffect, useCallback } from "react"
import { UserSearch, Search, ChevronLeft, ChevronRight, Network } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Input } from "@/components/UI/input"
import { Spinner } from "@/components/UI/spinner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { SanctionsHistory } from "@/components/Admin/PlayerSearchTab/SanctionsHistory"

const ITEMS_PER_PAGE = 20

const Badge = ({ children, className = "" }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{children}</span>
)

export function PlayerSearchTab() {
  const { hasFlag } = useAuth()
  const [players, setPlayers] = useState([])
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState({})
  const [expandedPlayer, setExpandedPlayer] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const canView = hasFlag("@web/search.players")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [search])

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/players-ips?page=${currentPage}&limit=${ITEMS_PER_PAGE}&search=${encodeURIComponent(debouncedSearch)}`, { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setPlayers(data.players)
        setTotal(data.total)

        const steamIds = data.players.map((player) => player.steamId).filter((id) => id && id !== "").join(",")
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
      console.error("Error fetching players:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch])

  useEffect(() => {
    if (canView) {
      fetchPlayers()
    }
  }, [fetchPlayers, canView])

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getAvatarUrl = (steamId) => {
    return profiles[steamId]?.avatarUrl || "/placeholder.svg?height=40&width=40"
  }

  const getDisplayName = (player) => {
    return profiles[player.steamId]?.displayName || player.name
  }

  const togglePlayerExpand = (steamId) => {
    setExpandedPlayer(expandedPlayer === steamId ? null : steamId)
  }

  const handlePlayerClick = (player) => {
    if (selectedPlayer?.steamId === player.steamId) {
      setSelectedPlayer(null)
    } else {
      setSelectedPlayer({
        steamId: player.steamId,
        name: getDisplayName(player),
        avatarUrl: getAvatarUrl(player.steamId)
      })
    }
  }

  const handleCloseHistory = () => {
    setSelectedPlayer(null)
  }

  if (!canView) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="text-center py-8 text-zinc-400">
            <UserSearch className="size-12 mx-auto mb-4 text-zinc-600" />
            <p>No tienes permisos para buscar jugadores.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {selectedPlayer && (
        <SanctionsHistory steamId={selectedPlayer.steamId} playerName={selectedPlayer.name} avatarUrl={selectedPlayer.avatarUrl} onClose={handleCloseHistory} />
      )}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserSearch className="size-5 text-[#FFB800]" />
            <div>
              <CardTitle className="text-zinc-100">Búsqueda de jugadores</CardTitle>
              <p className="text-zinc-400 text-sm mt-1">Busca jugadores por su nombre, SteamID64 o IP</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input placeholder="Buscar por nombre, SteamID64 o IP..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full bg-zinc-800 border-zinc-700 text-zinc-100" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6 text-[#FFB800]" />
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">No se encontraron registros de jugadores</div>
          ) : (
            <>
              <div className="space-y-2">
                {players.map((player) => (
                  <div key={player.steamId} className={`bg-zinc-800 rounded-lg border border-zinc-700 p-4 cursor-pointer transition-all hover:bg-zinc-700 hover:border-zinc-600 ${selectedPlayer?.steamId === player.steamId ? 'ring-2 ring-[#FFB800] border-[#FFB800]' : ''}`} onClick={() => handlePlayerClick(player)} >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <a href={`https://steamcommunity.com/profiles/${player.steamId}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} >
                          <Avatar className="size-10 shrink-0 hover:ring-2 hover:ring-[#FFB800] transition-all cursor-pointer">
                            <AvatarImage src={getAvatarUrl(player.steamId) || "/placeholder.svg"} alt={player.name} />
                            <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </a>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-zinc-100 font-medium">{getDisplayName(player)}</span>
                            <span className="text-zinc-500 text-xs font-mono">({player.steamId})</span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
                            <span>
                              <span className="text-zinc-500">Última conexión:</span>{" "}
                              <span className="text-zinc-300">{player.lastConnection}</span>
                            </span>
                            <span>
                              <span className="text-zinc-500">Conexiones:</span>{" "}
                              <span className="text-zinc-300">{player.totalConnections}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-blue-600 text-white">{player.totalConnections} {player.totalConnections === 1 ? "registro" : "registros"}</Badge>
                    </div>

                    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" onClick={() => togglePlayerExpand(player.steamId)} className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 transition-colors" >
                        <Network className="size-3 mr-1" />
                        {expandedPlayer === player.steamId ? "Ocultar" : "Ver"} su dirección IP
                      </Button>

                      {expandedPlayer === player.steamId && (
                        <div className="mt-3 space-y-2">
                          <div className="space-y-1">
                            {player.recentIps.map((record, idx) => (
                              <div key={idx} className="bg-zinc-900 rounded p-2 flex justify-between items-center text-sm" >
                                <span className="font-mono text-zinc-300">{record.ip}</span>
                                <span className="text-zinc-500 text-xs">{record.date}</span>
                              </div>
                            ))}
                          </div>
                          {player.totalConnections > 5 && (
                            <p className="text-xs text-zinc-500 italic mt-2">Mostrando las 5 conexiones más recientes de {player.totalConnections} totales</p>
                          )}
                        </div>
                      )}
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
                          <Button key={pageNum} variant={currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => handlePageChange(pageNum)} className={currentPage === pageNum ? "bg-[#FFB800] hover:bg-[#ce9300]" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"}>{pageNum}</Button>
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
    </>
  )
}