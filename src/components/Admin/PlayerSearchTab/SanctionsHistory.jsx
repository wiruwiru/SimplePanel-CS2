"use client"

import { useState, useEffect } from "react"
import { Ban, VolumeX, X, MessageSquareOff, Mic, Volume2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Spinner } from "@/components/UI/spinner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"

const getStatusConfig = (status) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return { label: 'Activo', className: 'bg-red-600 text-white' };
    case 'EXPIRED':
      return { label: 'Expirado', className: 'bg-green-600 text-white' };
    case 'UNBANNED':
      return { label: 'Desbaneado', className: 'bg-blue-600 text-white' };
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
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const MuteTypeBadge = ({ type }) => {
  const config = getMuteTypeConfig(type);
  const Icon = config.icon;
  
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-0.5 ${config.className}`}>
      <Icon className="size-2.5" />
      {config.label}
    </span>
  );
};

const SanctionTypeBadge = ({ type }) => {
  if (type === 'BAN') {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-700 text-white flex items-center gap-0.5">
        <Ban className="size-2.5" />
        Ban
      </span>
    );
  }
  return <MuteTypeBadge type={type} />;
};

export function SanctionsHistory({ steamId, playerName, onClose, avatarUrl }) {
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
      <div className="fixed left-4 top-28 w-[280px] max-h-[calc(100vh-8rem)] bg-zinc-900 border border-zinc-800 rounded-lg z-50 overflow-hidden shadow-xl hidden 2xl:block">
        <Card className="bg-zinc-900 border-0 h-full flex flex-col">
        <CardHeader className="border-b border-zinc-800 p-3">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-zinc-100 flex items-center gap-1.5 text-sm">
              <Ban className="size-4 text-[#FFB800]" />
              <span>Historial</span>
            </CardTitle>
            <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded transition-colors" aria-label="Cerrar" >
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
                <div className="text-zinc-500 text-xs font-mono truncate">{steamId.slice(-8)}</div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 p-3 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-5 text-[#FFB800]" />
            </div>
          ) : sanctions.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <Ban className="size-8 mx-auto mb-2 text-zinc-600" />
              <p className="text-xs">No hay sanciones</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sanctions.map((sanction) => (
                <div key={`${sanction.type}-${sanction.id}`} className="bg-zinc-800 rounded border border-zinc-700 p-2.5 space-y-1.5" >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <SanctionTypeBadge type={sanction.type} />
                      <StatusBadge status={sanction.status} />
                    </div>
                    <span className="text-zinc-500 text-[10px] whitespace-nowrap">{sanction.date.split(',')[0]}</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-zinc-300 line-clamp-1">
                      <span className="text-zinc-500">Razón:</span> {sanction.reason}
                    </div>
                    <div className="text-zinc-400">
                      <span className="text-zinc-500">Duración:</span> {sanction.duration}
                    </div>
                    <div className="text-zinc-400">
                      <span className="text-zinc-500">Admin:</span> {sanction.admin}
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
        <Card className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md max-h-[calc(100vh-2rem)] flex flex-col shadow-xl">
          <CardHeader className="border-b border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Ban className="size-5 text-[#FFB800]" />
                <span>Historial de sanciones</span>
              </CardTitle>
              <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded transition-colors" aria-label="Cerrar" >
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
          <CardContent className="flex-1 p-4 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="size-6 text-[#FFB800]" />
              </div>
            ) : sanctions.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <Ban className="size-12 mx-auto mb-4 text-zinc-600" />
                <p>No se encontraron sanciones</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sanctions.map((sanction) => (
                  <div key={`${sanction.type}-${sanction.id}`} className="bg-zinc-800 rounded-lg border border-zinc-700 p-3 space-y-2" >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SanctionTypeBadge type={sanction.type} />
                        <StatusBadge status={sanction.status} />
                      </div>
                      <span className="text-zinc-500 text-xs whitespace-nowrap">{sanction.date}</span>
                    </div>
                    
                    <div className="space-y-1.5 text-sm">
                      <div className="text-zinc-300">
                        <span className="text-zinc-500">Razón:</span> {sanction.reason}
                      </div>
                      <div className="text-zinc-400">
                        <span className="text-zinc-500">Duración:</span> {sanction.duration}
                      </div>
                      <div className="text-zinc-400">
                        <span className="text-zinc-500">Admin:</span> {sanction.admin}
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