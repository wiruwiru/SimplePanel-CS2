"use client"

import { useState } from "react"
import { MessageSquare, Search, Filter } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useChatLogs } from "@/hooks/useChatLogs"
import { Input } from "@/components/UI/input"
import { Button } from "@/components/UI/button"
import { ChatLogsList } from "@/components/Admin/ChatLogsTab/ChatLogsList"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"

export function ChatLogsTab() {
  const { hasFlag } = useAuth()
  const [showFilters, setShowFilters] = useState(false)
  
  const canView = hasFlag("@web/chatlogs.view")
  const { chatlogs, search, setSearch, playerSearch, setPlayerSearch, team, setTeam, messageType, setMessageType, serverId, setServerId, servers, currentPage, total, totalPages, startIndex, loading, getAvatarUrl, getDisplayName, handlePageChange, clearFilters, hasActiveFilters } = useChatLogs(canView)

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
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800">
                    Limpiar filtros
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Equipo</label>
                  <select value={team} onChange={(e) => setTeam(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] w-full" >
                    <option value="">Todos</option>
                    <option value="0">NONE</option>
                    <option value="1">SPECT</option>
                    <option value="2">TT</option>
                    <option value="3">CT</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Tipo de mensaje</label>
                  <select value={messageType} onChange={(e) => setMessageType(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] w-full" >
                    <option value="">Todos</option>
                    <option value="global">Global</option>
                    <option value="team">Team</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 text-sm mb-1 block">Servidor</label>
                  <select value={serverId} onChange={(e) => setServerId(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB800] w-full" >
                    <option value="">Todos los servidores</option>
                    {servers.map((server) => (
                      <option key={server.id} value={server.id}>
                        {server.name || `Servidor ${server.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <ChatLogsList chatlogs={chatlogs} loading={loading} getAvatarUrl={getAvatarUrl} getDisplayName={getDisplayName} currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} total={total} onPageChange={handlePageChange} />
      </CardContent>
    </Card>
  )
}