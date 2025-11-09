"use client"

import { useState, useEffect } from "react"
import { VolumeX, MessageSquareOff, Mic, Volume2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Spinner } from "@/components/UI/spinner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/UI/avatar"

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
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const MuteTypeBadge = ({ type }) => {
  const config = getMuteTypeConfig(type);
  const Icon = config.icon;
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${config.className}`}>
      <Icon className="size-3" />
      {config.label}
    </span>
  );
};

export function RecentMutes() {
  const [recentMutes, setRecentMutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState({})

  useEffect(() => {
    const fetchRecentMutes = async () => {
      try {
        const response = await fetch("/api/sanctions/recent-mutes", { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          setRecentMutes(data)

          const steamIds = data.map(mute => mute.steamId).filter(id => id && id !== "").join(",")
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
        console.error("Error fetching recent mutes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentMutes()
  }, [])

  const getAvatarUrl = (steamId) => {
    return profiles[steamId]?.avatarUrl || "/placeholder.svg?height=40&width=40"
  }

  const getDisplayName = (mute) => {
    return profiles[mute.steamId]?.displayName || mute.player
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100 text-lg md:text-xl">
          <VolumeX className="size-5 text-yellow-500" />Últimos muteos</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6 text-[#FFB800]" />
          </div>
        ) : recentMutes.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">No se han encontrado muteos recientes</div>
        ) : (
          <div className="space-y-3 flex-1">
            {recentMutes.map((mute) => (
              <div key={mute.id} className="p-3 md:p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                <div className="flex items-start gap-3 mb-2">
                  <a href={`https://steamcommunity.com/profiles/${mute.steamId}`} target="_blank" rel="noopener noreferrer" >
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage src={getAvatarUrl(mute.steamId)} alt={mute.player} />
                      <AvatarFallback>{mute.player.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-100 text-sm md:text-base break-all mb-1">{getDisplayName(mute)}</div>
                    <div className="text-zinc-500 text-xs md:text-sm break-all">{mute.steamId}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <MuteTypeBadge type={mute.type} />
                    <StatusBadge status={mute.status} />
                  </div>
                </div>
                <div className="text-zinc-400 text-xs md:text-sm space-y-1">
                  <div>
                    <span className="text-zinc-500">Razón:</span> {mute.reason}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span>
                      <span className="text-zinc-500">Admin:</span> {mute.admin}
                    </span>
                    <span>
                      <span className="text-zinc-500">Duración:</span> {mute.duration}
                    </span>
                  </div>
                  <div className="text-zinc-500 text-xs">{mute.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}