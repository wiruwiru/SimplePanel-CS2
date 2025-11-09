"use client"

import { useState, useEffect } from "react"
import { Server, Users, ClipboardCopy, GamepadIcon } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/UI/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Button } from "@/components/UI/button"
import { Spinner } from "@/components/UI/spinner"
import { addToast } from "@heroui/react"

const getMapImageUrl = (mapName) => {
  return `https://cdn.jsdelivr.net/gh/wiruwiru/MapsImagesCDN-CS/avif/${mapName}.avif`
}

export function ServersList() {
  const [servers, setServers] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailedInfo, setDetailedInfo] = useState({})
  const [loadingDetails, setLoadingDetails] = useState({})
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    fetchServers()

    const interval = setInterval(fetchServers, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchServers = async () => {
    try {
      const response = await fetch("/api/servers", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setServers(data)
      }
    } catch (error) {
      console.error("Error fetching servers:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchServerDetails = async (serverId, address) => {
    if (detailedInfo[serverId]) return

    setLoadingDetails((prev) => ({ ...prev, [serverId]: true }))

    try {
      const response = await fetch(`/api/servers/details?address=${encodeURIComponent(address)}`, {
        cache: "no-store"
      })
      const data = await response.json()

      setDetailedInfo((prev) => ({ ...prev, [serverId]: data }))
    } catch (error) {
      console.error("Error fetching server details:", error)
      setDetailedInfo((prev) => ({ 
        ...prev, 
        [serverId]: { offline: true, error: "No se pudo conectar al servidor" } 
      }))
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [serverId]: false }))
    }
  }

  const handleAccordionChange = (value) => {
    if (value) {
      const serverId = Number.parseInt(value.replace("server-", ""))
      const server = servers.find((s) => s.id === serverId)
      if (server && !detailedInfo[serverId] && !loadingDetails[serverId]) {
        fetchServerDetails(serverId, server.address)
      }
    }
  }

  const handleCopyIP = async (serverId, address) => {
    try {
      await navigator.clipboard.writeText(`connect ${address}`)
      setCopiedId(serverId)
      addToast({title: "Comando de conexión copiado al portapapeles", color: "success", variant: "solid"})
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      addToast({title: "Comando de conexión copiado al portapapeles", color: "danger", variant: "solid"})
    }
  }

  const handleConnect = (address) => {
    window.location.href = `steam://connect/${address}`
  }

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-8 text-[#FFB800]" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (servers.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-100 text-lg md:text-xl">
            <Server className="size-5 text-[#FFB800]" />Servidores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400 text-center py-4">No hay servidores disponibles</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100 text-lg md:text-xl">
          <Server className="size-5 text-[#FFB800]" />Servidores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="space-y-2" onValueChange={handleAccordionChange}>
          {servers.map((server) => {
            const details = detailedInfo[server.id]
            const isLoadingDetails = loadingDetails[server.id]
            const isOnline = server.status === "online"

            return (
              <AccordionItem key={server.id} value={`server-${server.id}`} className="bg-zinc-800 rounded-lg border border-zinc-700 px-3 md:px-4">
                <AccordionTrigger className="hover:no-underline py-3 md:py-4">
                  <div className="flex items-center justify-between w-full pr-2 md:pr-4">
                    <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                      <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full shrink-0 ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                      <div className="text-left min-w-0 flex-1 max-w-[200px] xs:max-w-[280px] sm:max-w-[420px] md:max-w-[600px] lg:max-w-none">
                        <div className="text-zinc-100 text-sm md:text-base truncate">{server.name}</div>
                        <div className="text-zinc-400 text-xs md:text-sm truncate">{server.map}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                      <div className="hidden sm:flex items-center gap-2 text-zinc-300">
                        <Users className="size-3 md:size-4" />
                        <span className="text-xs md:text-sm">{server.players}/{server.maxPlayers}</span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3 md:pb-4 pt-2">
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner className="size-6 text-[#FFB800]" />
                      <span className="ml-3 text-zinc-400">Obteniendo detalles del servidor...</span>
                    </div>
                  ) : details?.offline ? (
                    <div className="bg-zinc-900 rounded-lg p-4 text-center">
                      <p className="text-red-500 mb-2">No se pudieron obtener detalles</p>
                      <p className="text-zinc-500 text-sm">{details.error || "El servidor no responde"}</p>
                    </div>
                  ) : details ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 bg-zinc-900 rounded-lg p-3 md:p-4">
                        <div className="relative w-full h-48 lg:h-auto rounded-lg overflow-hidden bg-zinc-800">
                          <img src={getMapImageUrl(details.map)} alt={`Mapa ${details.map}`} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-3">
                            <p className="text-white text-sm">{details.map}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-zinc-500 mb-1 text-xs md:text-sm">IP del Servidor</p>
                              <p className="text-zinc-300 text-sm md:text-base break-all font-mono">{server.address}</p>
                            </div>
                            <div>
                              <p className="text-zinc-500 mb-1 text-xs md:text-sm">Jugadores</p>
                              <p className="text-zinc-300 text-sm md:text-base">{details.numPlayers}/{details.maxPlayers}</p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button onClick={() => handleCopyIP(server.id, server.address)} className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors" ><ClipboardCopy className="size-4" />{copiedId === server.id ? "¡Copiado!" : "Copiar IP"}</Button>
                            <Button onClick={() => handleConnect(server.address)} className="flex items-center justify-center gap-2 bg-[#FFB800] hover:bg-[#ce9300] text-white transition-colors" >
                              <GamepadIcon className="size-4" />Conectar</Button>
                          </div>
                        </div>
                      </div>

                      {details.players && details.players.length > 0 ? (
                        <div className="bg-zinc-900 rounded-lg p-3 md:p-4">
                          <h4 className="text-zinc-100 mb-3 flex items-center gap-2">
                            <Users className="size-4" />
                            Lista de jugadores ({details.players.length})
                          </h4>
                          <div className="space-y-2">
                            {details.players.map((player, idx) => {
                              const score = player.score
                              const time = player.time

                              return (
                                <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700/50 transition-colors" >
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
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-zinc-900 rounded-lg p-4 text-center">
                          <p className="text-zinc-400">No hay jugadores conectados</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-zinc-900 rounded-lg p-3 md:p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-zinc-500 mb-1 text-xs md:text-sm">IP del Servidor</p>
                          <p className="text-zinc-300 text-sm md:text-base break-all font-mono">{server.address}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 mb-1 text-xs md:text-sm">Estado</p>
                          <p className="text-zinc-300 text-sm md:text-base">{isOnline ? "En línea" : "Fuera de línea"}</p>
                        </div>
                      </div>
                      <p className="text-zinc-400 text-center mt-4 text-sm">Haz clic para ver detalles y lista de jugadores</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  )
}