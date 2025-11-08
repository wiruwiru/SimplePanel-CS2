"use client"

import { Server, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Badge } from "@/components/UI/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/UI/accordion"
import { servers } from "@/data/servers"

const getMapImageUrl = (mapName) => {
  return `https://cdn.jsdelivr.net/gh/wiruwiru/MapsImagesCDN-CS/avif/${mapName}.avif`
}

export function ServersList() {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100 text-lg md:text-xl">
          <Server className="size-5 text-orange-500" />Servidores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-2">
          {servers.map((server) => (
            <AccordionItem key={server.id} value={`server-${server.id}`} className="bg-zinc-800 rounded-lg border border-zinc-700 px-3 md:px-4" >
              <AccordionTrigger className="hover:no-underline py-3 md:py-4">
                <div className="flex items-center justify-between w-full pr-2 md:pr-4">
                  <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full shrink-0 ${server.status === "online" ? "bg-green-500" : "bg-red-500"}`} />
                    <div className="text-left min-w-0 flex-1">
                      <div className="text-zinc-100 text-sm md:text-base truncate">{server.name}</div>
                      <div className="text-zinc-400 text-xs md:text-sm">{server.map}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    <div className="hidden sm:flex items-center gap-2 text-zinc-300">
                      <Users className="size-3 md:size-4" />
                      <span className="text-xs md:text-sm">{server.players.current}/{server.players.max}</span>
                    </div>
                    <Badge variant={server.status === "online" ? "default" : "secondary"} className={`text-xs ${server.status === "online" ? "bg-green-600 hover:bg-green-700" : "bg-zinc-700"}`} >
                      {server.status}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3 md:pb-4 pt-2">
                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 bg-zinc-900 rounded-lg p-3 md:p-4">
                  <div className="relative w-full h-48 lg:h-auto rounded-lg overflow-hidden bg-zinc-800">
                    <img src={getMapImageUrl(server.map) || "/placeholder.svg"} alt={`Mapa ${server.map}`} className="w-full h-full object-cover" onError={(e) => {e.currentTarget.src = "https://via.placeholder.com/400x225/27272a/a1a1aa?text=Sin+imagen"}} />
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3">
                      <p className="text-white text-sm">{server.map}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-zinc-500 mb-1 text-xs md:text-sm">IP del Servidor</p>
                      <p className="text-zinc-300 text-sm md:text-base break-all font-mono">{server.ip}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1 text-xs md:text-sm">Jugadores</p>
                      <p className="text-zinc-300 text-sm md:text-base">{server.players.current}/{server.players.max}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1 text-xs md:text-sm">Modo de Juego</p>
                      <p className="text-zinc-300 text-sm md:text-base">{server.gamemode}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 mb-1 text-xs md:text-sm">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {server.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-zinc-800 text-zinc-400 text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}