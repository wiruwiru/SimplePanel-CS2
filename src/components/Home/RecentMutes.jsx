import { VolumeX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Badge } from "@/components/UI/badge"
import { mutes } from "@/data/sanctions"

export function RecentMutes() {
  const recentMutes = mutes.filter((m) => m.status === "active").slice(0, 5)

  return (
    <Card className="bg-zinc-900 border-zinc-800 flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100 text-lg md:text-xl">
          <VolumeX className="size-5 text-yellow-500" />Últimos Muteos</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          {recentMutes.map((mute) => (
            <div key={mute.id} className="p-3 md:p-4 bg-zinc-800 rounded-lg border border-zinc-700">
              <div className="flex items-start gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="bg-yellow-600 text-xs">
                  Muteo
                </Badge>
                <span className="text-zinc-100 text-sm md:text-base break-all">{mute.player}</span>
              </div>
              <div className="text-zinc-500 text-xs md:text-sm mb-1 break-all">{mute.steamId}</div>
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
      </CardContent>
    </Card>
  )
}