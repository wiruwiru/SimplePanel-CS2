"use client"

import { useState, useEffect } from "react"
import { Ban, VolumeX, X, MessageSquareOff, Mic, Volume2 } from "lucide-react"
import { useI18n } from "@/contexts/I18nContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Spinner } from "@/components/UI/spinner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/UI/hover-card"

const getStatusConfig = (status, t) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return { label: t('common.active'), className: 'bg-red-600 text-white' };
    case 'EXPIRED':
      return { label: t('common.expired'), className: 'bg-green-600 text-white' };
    case 'UNBANNED':
      return { label: t('common.unbanned'), className: 'bg-blue-600 text-white' };
    case 'UNMUTED':
      return { label: t('common.unmuted'), className: 'bg-blue-600 text-white' };
    default:
      return { label: t('admin.player_search.unknown'), className: 'bg-zinc-700 text-white' };
  }
};

const getMuteTypeConfig = (type, t) => {
  switch (type?.toUpperCase()) {
    case 'GAG':
      return {
        label: t('admin.player_search.gag'),
        icon: MessageSquareOff,
        className: 'bg-orange-600 text-white'
      };
    case 'MUTE':
      return {
        label: t('admin.player_search.mute'),
        icon: Mic,
        className: 'bg-purple-600 text-white'
      };
    case 'SILENCE':
      return {
        label: t('admin.player_search.silence'),
        icon: Volume2,
        className: 'bg-pink-600 text-white'
      };
    default:
      return {
        label: t('admin.player_search.unknown'),
        icon: VolumeX,
        className: 'bg-zinc-700 text-white'
      };
  }
};

const StatusBadge = ({ status, t }) => {
  const config = getStatusConfig(status, t);
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const MuteTypeBadge = ({ type, t }) => {
  const config = getMuteTypeConfig(type, t);
  const Icon = config.icon;
  
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 ${config.className}`}>
      <Icon className="size-2.5" />
      {config.label}
    </span>
  );
};

const SanctionTypeBadge = ({ type, t }) => {
  if (type === 'BAN') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-700 text-white flex items-center gap-0.5">
        <Ban className="size-2.5" />
        {t('admin.player_search.ban')}
      </span>
    );
  }
  return <MuteTypeBadge type={type} t={t} />;
};

export function SanctionsHistory({ steamId, playerName, onClose, avatarUrl }) {
  const { t } = useI18n()
  const [sanctions, setSanctions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!steamId) return

    const fetchSanctions = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/sanctions/history?steamId=${steamId}`, { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          setSanctions(data.sanctions || [])
        }
      } catch (error) {
        console.error("Error fetching sanctions history:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSanctions()
  }, [steamId])

  if (!steamId) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      <div className="fixed left-4 top-28 bottom-24 w-[280px] bg-zinc-900 border border-zinc-800 rounded-lg z-50 overflow-hidden shadow-xl hidden 2xl:block">
        <Card className="bg-zinc-900 border-0 h-full flex flex-col">
        <CardHeader className="border-b border-zinc-800 p-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-zinc-100 flex items-center gap-1.5 text-sm">
              <Ban className="size-4" style={{ color: 'var(--theme-primary)' }} />
              <span>{t('admin.player_search.sanctions_history_title')}</span>
            </CardTitle>
            <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded transition-colors" aria-label={t('admin.player_search.close')} >
              <X className="size-4 text-zinc-400" />
            </button>
          </div>
          {playerName && (
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarImage src={avatarUrl} alt={playerName} />
                <AvatarFallback className="text-xs">{playerName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-zinc-100 font-medium truncate text-sm">{playerName}</div>
                <div className="text-zinc-500 text-xs font-mono truncate">({steamId})</div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 p-3 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-5" style={{ color: 'var(--theme-primary)' }} />
            </div>
          ) : sanctions.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <Ban className="size-8 mx-auto mb-2 text-zinc-600" />
              <p className="text-xs">{t('admin.player_search.no_sanctions')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sanctions.map((sanction) => (
                <div key={`${sanction.type}-${sanction.id}`} className="bg-zinc-800 rounded border border-zinc-700 p-2.5 space-y-1.5" >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <SanctionTypeBadge type={sanction.type} t={t} />
                      <StatusBadge status={sanction.status} t={t} />
                    </div>
                    <span className="text-zinc-500 text-[10px] whitespace-nowrap">{sanction.date.split(',')[0]}</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="text-zinc-300 line-clamp-1 cursor-help">
                          <span className="text-zinc-500">{t('common.reason')}:</span> {sanction.reason}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-auto max-w-xs p-3 bg-zinc-800 border-zinc-700 text-zinc-100">
                        <div className="text-xs">
                          <div className="font-medium mb-1 text-zinc-400">{t('common.reason')}:</div>
                          <div className="text-zinc-300">{sanction.reason}</div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    <div className="text-zinc-400">
                      <span className="text-zinc-500">{t('common.duration')}:</span> {sanction.duration}
                    </div>
                    <div className="text-zinc-400">
                      <span className="text-zinc-500">{t('common.admin')}:</span> {sanction.admin}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
      <div className="fixed inset-4 2xl:hidden z-50 flex items-center justify-center">
        <Card className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md max-h-[calc(100vh-8rem)] flex flex-col shadow-xl">
          <CardHeader className="border-b border-zinc-800 p-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Ban className="size-5" style={{ color: 'var(--theme-primary)' }} />
                <span>{t('admin.player_search.sanctions_history_title_full')}</span>
              </CardTitle>
              <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded transition-colors" aria-label={t('admin.player_search.close')} >
                <X className="size-5 text-zinc-400" />
              </button>
            </div>
            {playerName && (
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={avatarUrl} alt={playerName} />
                  <AvatarFallback>{playerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-zinc-100 font-medium truncate">{playerName}</div>
                  <div className="text-zinc-500 text-xs font-mono truncate">{steamId}</div>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-4 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="size-6" style={{ color: 'var(--theme-primary)' }} />
              </div>
            ) : sanctions.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <Ban className="size-12 mx-auto mb-4 text-zinc-600" />
                <p>{t('admin.player_search.no_sanctions_found')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sanctions.map((sanction) => (
                  <div key={`${sanction.type}-${sanction.id}`} className="bg-zinc-800 rounded-lg border border-zinc-700 p-3 space-y-2" >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SanctionTypeBadge type={sanction.type} t={t} />
                        <StatusBadge status={sanction.status} t={t} />
                      </div>
                      <span className="text-zinc-500 text-xs whitespace-nowrap">{sanction.date}</span>
                    </div>
                    
                    <div className="space-y-1.5 text-sm">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="text-zinc-300 line-clamp-2 cursor-help">
                            <span className="text-zinc-500">{t('common.reason')}:</span> {sanction.reason}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-auto max-w-sm p-3 bg-zinc-800 border-zinc-700 text-zinc-100">
                          <div className="text-sm">
                            <div className="font-medium mb-1 text-zinc-400">{t('common.reason')}:</div>
                            <div className="text-zinc-300">{sanction.reason}</div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                      <div className="text-zinc-400">
                        <span className="text-zinc-500">{t('common.duration')}:</span> {sanction.duration}
                      </div>
                      <div className="text-zinc-400">
                        <span className="text-zinc-500">{t('common.admin')}:</span> {sanction.admin}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}