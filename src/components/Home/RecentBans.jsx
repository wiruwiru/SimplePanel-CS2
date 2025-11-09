"use client"

import { useState, useEffect } from "react"
import { Ban } from "lucide-react"
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
    default:
      return { label: 'Desconocido', className: 'bg-zinc-700 text-white' };
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

export function RecentBans() {
  const [recentBans, setRecentBans] = useState([])
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState({})

  useEffect(() => {
    const fetchRecentBans = async () => {
      try {
        const response = await fetch("/api/sanctions/recent-bans", { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          setRecentBans(data)

          const steamIds = data.map(ban => ban.steamId).filter(id => id && id !== "").join(",")
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
        console.error("Error fetching recent bans:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentBans()
  }, [])

  const getAvatarUrl = (steamId) => {
    return profiles[steamId]?.avatarUrl || "/placeholder.svg?height=40&width=40"
  }

  const getDisplayName = (ban) => {
    return profiles[ban.steamId]?.displayName || ban.player
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100 text-lg md:text-xl">
          <Ban className="size-5 text-red-500" />Últimos baneos</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6 text-[#FFB800]" />
          </div>
        ) : recentBans.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">No se han encontrado baneos recientes</div>
        ) : (
          <div className="space-y-3 flex-1">
            {recentBans.map((ban) => (
              <div key={ban.id} className="p-3 md:p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                <div className="flex items-start gap-3 mb-2">
                  <a href={`https://steamcommunity.com/profiles/${ban.steamId}`} target="_blank" rel="noopener noreferrer" >
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage src={getAvatarUrl(ban.steamId)} alt={ban.player} />
                      <AvatarFallback>{ban.player.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-100 text-sm md:text-base break-all mb-1">{getDisplayName(ban)}</div>
                    <div className="text-zinc-500 text-xs md:text-sm break-all">{ban.steamId}</div>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={ban.status} />
                  </div>
                </div>
                <div className="text-zinc-400 text-xs md:text-sm space-y-1">
                  <div>
                    <span className="text-zinc-500">Razón:</span> {ban.reason}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span>
                      <span className="text-zinc-500">Admin:</span> {ban.admin}
                    </span>
                    <span>
                      <span className="text-zinc-500">Duración:</span> {ban.duration}
                    </span>
                  </div>
                  <div className="text-zinc-500 text-xs">{ban.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}