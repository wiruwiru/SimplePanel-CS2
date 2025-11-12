"use client"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { Spinner } from "@/components/UI/spinner"
import { Pagination } from "../BansTab/Pagination"

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
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${isTeam ? "bg-purple-600 text-white" : "bg-green-600 text-white"}`} >
      {isTeam ? "Team" : "Global"}
    </span>
  )
}

export function ChatLogsList({ chatlogs, loading, getAvatarUrl, getDisplayName, currentPage, totalPages, startIndex, total, onPageChange }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-6 text-[#FFB800]" />
      </div>
    )
  }

  if (chatlogs.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">No se encontraron mensajes</div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {chatlogs.map((log) => (
          <div key={log.id} className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <a href={`https://steamcommunity.com/profiles/${log.playerSteam64}`} target="_blank" rel="noopener noreferrer">
                  <Avatar className="size-10 shrink-0 hover:ring-2 hover:ring-[#FFB800] transition-all cursor-pointer">
                    <AvatarImage src={getAvatarUrl(log.playerSteam64)} alt={log.playerName} />
                    <AvatarFallback>{log.playerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </a>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-zinc-100 font-medium">{getDisplayName(log.playerSteam64, log.playerName)}</span>
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
        <Pagination currentPage={currentPage} totalPages={totalPages} startIndex={startIndex} total={total} onPageChange={onPageChange} />
      )}
    </>
  )
}