"use client"

import { Server } from "lucide-react"
import { addToast } from "@heroui/react"
import { useState, useEffect } from "react"
import { Spinner } from "@/components/UI/spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/UI/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/UI/accordion"
import { ServerCardHeader } from "@/components/Home/ServerList/ServerCard"
import { ServerDetails } from "@/components/Home/ServerList/ServerDetails"

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
      addToast({title: "Error al copiar", color: "danger", variant: "solid"})
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
            <Spinner className="size-8" style={{ color: 'var(--theme-primary)' }} />
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
            <Server className="size-5" style={{ color: 'var(--theme-primary)' }} />Servidores
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
          <Server className="size-5" style={{ color: 'var(--theme-primary)' }} />Servidores
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
                  <ServerCardHeader server={server} isOnline={isOnline} />
                </AccordionTrigger>
                <AccordionContent className="pb-3 md:pb-4 pt-2">
                  <ServerDetails server={server} details={details} isLoading={isLoadingDetails} onCopyIP={handleCopyIP} onConnect={handleConnect} copiedId={copiedId} />
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </CardContent>
    </Card>
  )
}