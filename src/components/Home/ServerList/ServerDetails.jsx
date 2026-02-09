"use client"

import { ClipboardCopy, GamepadIcon, Users } from "lucide-react"
import { Button } from "@/components/UI/button"
import { Spinner } from "@/components/UI/spinner"
import { getMapImageUrl } from "@/utils/map-utils"
import { useI18n } from "@/contexts/I18nContext"

export function ServerDetails({ server, details, isLoading, onCopyIP, onConnect, copiedId }) {
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="size-6" style={{ color: 'var(--theme-primary)' }} />
        <span className="ml-3 text-zinc-400">{t('servers.fetching_details')}</span>
      </div>
    )
  }

  if (details?.offline) {
    return (
      <div className="bg-zinc-900 rounded-lg p-4 text-center">
        <p className="text-red-500 mb-2">{t('servers.could_not_fetch_details')}</p>
        <p className="text-zinc-500 text-sm">{details.error || t('servers.server_not_responding')}</p>
      </div>
    )
  }

  if (!details) {
    return (
      <div className="bg-zinc-900 rounded-lg p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-zinc-500 mb-1 text-xs md:text-sm">{t('servers.server_ip')}</p>
            <p className="text-zinc-300 text-sm md:text-base break-all font-mono">{server.address}</p>
          </div>
          <div>
            <p className="text-zinc-500 mb-1 text-xs md:text-sm">{t('servers.status')}</p>
            <p className="text-zinc-300 text-sm md:text-base">{server.status === "online" ? t('servers.online') : t('servers.offline')}</p>
          </div>
        </div>
        <p className="text-zinc-400 text-center mt-4 text-sm">{t('servers.click_for_details')}</p>
      </div>
    )
  }

  const mapDisplay = details.map === "unknown" ? t('servers.offline_map') : details.map

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 bg-zinc-900 rounded-lg p-3 md:p-4">
        <div className="relative w-full h-48 lg:h-auto rounded-lg overflow-hidden bg-zinc-800">
          <img src={getMapImageUrl(details.map)} alt={`${t('servers.map')} ${mapDisplay}`} className="w-full h-full object-cover" />
          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3">
            <p className="text-white text-sm">{mapDisplay}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-zinc-500 mb-1 text-xs md:text-sm">{t('servers.server_ip')}</p>
              <p className="text-zinc-300 text-sm md:text-base break-all font-mono">{server.address}</p>
            </div>
            <div>
              <p className="text-zinc-500 mb-1 text-xs md:text-sm">{t('servers.players')}</p>
              <p className="text-zinc-300 text-sm md:text-base">{details.numPlayers}/{details.maxPlayers}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => onCopyIP(server.id, server.address)} className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors" >
              <ClipboardCopy className="size-4" />
              {copiedId === server.id ? t('servers.copied') : t('servers.copy_ip')}
            </Button>
            <Button onClick={() => onConnect(server.address)} className="flex items-center justify-center gap-2 transition-colors" style={{ backgroundColor: 'var(--theme-primary)', color: 'var(--theme-primary-foreground)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary-hover)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--theme-primary)'; }}>
              <GamepadIcon className="size-4" />
              {t('servers.connect')}
            </Button>
          </div>
        </div>
      </div>

      {details.players && details.players.length > 0 ? (
        <div className="bg-zinc-900 rounded-lg p-3 md:p-4">
          <h4 className="text-zinc-100 mb-3 flex items-center gap-2">
            <Users className="size-4" />
            {t('servers.player_list')} ({details.players.length})
          </h4>
          <div className="space-y-2">
            {details.players.map((player, idx) => (
              <PlayerItem key={idx} player={player} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg p-4 text-center">
          <p className="text-zinc-400">{t('servers.no_players_connected')}</p>
        </div>
      )}
    </div>
  )
}

function PlayerItem({ player }) {
  const score = player.score
  const time = player.time

  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700/50 transition-colors">
      <p className="text-zinc-100 text-sm truncate flex-1 min-w-0">{player.name}</p>
      <div className="flex items-center gap-2 shrink-0">
        {score !== undefined && (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">{score} pts</span>
        )}
        {time !== undefined && (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-600 text-white">{Math.floor(time / 60)}m</span>
        )}
      </div>
    </div>
  )
}