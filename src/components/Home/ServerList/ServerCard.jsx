"use client"

import { Users } from "lucide-react"

export function ServerCardHeader({ server, isOnline }) {
  return (
    <div className="flex items-center justify-between w-full pr-2 md:pr-4">
      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
        <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full shrink-0 ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
        <div className="text-left min-w-0 flex-1 max-w-[200px] xs:max-w-[280px] sm:max-w-[420px] md:max-w-[600px] lg:max-w-none">
          <div className="text-zinc-100 text-sm md:text-base truncate">{server.name}</div>
          <div className="text-zinc-400 text-xs md:text-sm truncate">{server.map === "unknown" ? "APAGADO" : server.map}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-zinc-300">
          <Users className="size-3 md:size-4" />
          <span className="text-xs md:text-sm">{server.players}/{server.maxPlayers}</span>
        </div>
      </div>
    </div>
  )
}